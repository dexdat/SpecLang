#!/usr/bin/env python3
"""
Ralph Loop orchestrator for Speclang development.

REAL implementation using `opencode run` commands to spawn fresh agent instances.
Coordinates between Builder and Verifier agents following Ralph Loop pattern.

Key principle: Fresh agent instance each iteration (Ralph Wiggum pattern).
"""
import json
import re
import os
import subprocess
import time
import argparse
from pathlib import Path
from datetime import datetime


class RalphLoop:
    def __init__(self, builder_agent, verifier_agent, builder_model, verifier_model, todo_file, max_iterations, agent_timeout_minutes):
        self.todo_file = Path(todo_file)
        self.state_file = Path(".speclang/ralph_state.json")
        self.builder_agent = builder_agent
        self.verifier_agent = verifier_agent
        self.builder_model = builder_model
        self.verifier_model = verifier_model
        self.max_iterations = max_iterations
        self.agent_timeout_seconds = agent_timeout_minutes * 60  # Convert minutes to seconds
        self.steering_packets = []
        self.current_item = None
        
        # Load agent prompts
        self.builder_prompt = self._load_prompt_file("PROMPT.md")
        self.verifier_prompt = self._load_prompt_file("PROMPT-VERIFY.md")
        
        # Ensure .speclang directory exists
        os.makedirs(".speclang", exist_ok=True)
    
    def _load_prompt_file(self, filepath):
        """Load a prompt file from disk."""
        try:
            with open(filepath, 'r') as f:
                content = f.read()
                print(f"✅ Loaded prompt: {filepath} ({len(content)} chars)")
                return content
        except FileNotFoundError:
            print(f"⚠️  Prompt file not found: {filepath}")
            return None
        except Exception as e:
            print(f"❌ Error loading {filepath}: {str(e)}")
            return None
        
    def load_todo(self):
        """Load and parse TODO.md markdown checklist."""
        if not self.todo_file.exists():
            return []
        
        items = []
        with open(self.todo_file, 'r') as f:
            content = f.read()
            
        # Parse markdown checklist items
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            # Check for section headers
            if line.startswith('## '):
                current_section = line[3:].strip()
                continue
                
            # Check for checklist items
            if line.startswith('- [ ] ') or line.startswith('- [x] '):
                completed = line.startswith('- [x] ')
                description = line[6:].strip()
                
                items.append({
                    'description': description,
                    'section': current_section,
                    'completed': completed,
                    'assigned_to': None,
                    'started_at': None,
                    'completed_at': None,
                    'validation_passed': False,
                    'steering_packets': []
                })
        
        return items
    
    def save_todo(self, items):
        """Save updated TODO.md."""
        sections = {}
        
        # Group items by section
        for item in items:
            section = item['section'] or 'Uncategorized'
            if section not in sections:
                sections[section] = []
            sections[section].append(item)
        
        # Generate markdown
        lines = []
        lines.append("# Speclang Ralph Loop Todo List\n")
        
        for section, section_items in sections.items():
            lines.append(f"## {section}")
            for item in section_items:
                checkbox = '[x]' if item['completed'] else '[ ]'
                lines.append(f"- {checkbox} {item['description']}")
            lines.append("")
        
        with open(self.todo_file, 'w') as f:
            f.write('\n'.join(lines))
    
    def load_state(self):
        """Load loop state from file."""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {
            'phase': 'phase_1_manual_emulation',
            'builder': self.builder_agent,
            'verifier': self.verifier_agent,
            'total_items': 0,
            'completed_items': 0,
            'failed_items': 0,
            'iterations_completed': 0,
            'last_updated': datetime.now().isoformat(),
            'steering_packets_count': 0
        }
    
    def save_state(self, state):
        """Save loop state to file."""
        state['last_updated'] = datetime.now().isoformat()
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
    
    def create_steering_packet(self, packet_type, task_id, **kwargs):
        """Create a steering packet."""
        packet = {
            'id': f"sp-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'type': packet_type,
            'task_id': task_id,
            'created_at': datetime.now().isoformat(),
            'processed': False,
            'data': kwargs
        }
        
        self.steering_packets.append(packet)
        
        # Save to file for agents to read
        packets_file = Path(".speclang/steering_packets.json")
        packets = []
        if packets_file.exists():
            with open(packets_file, 'r') as f:
                packets = json.load(f)
        packets.append(packet)
        
        with open(packets_file, 'w') as f:
            json.dump(packets, f, indent=2)
        
        return packet
    
    def get_next_item(self, items):
        """Get next uncompleted item, respecting dependencies."""
        # Simple implementation: get first uncompleted item
        for item in items:
            if not item['completed'] and not item['assigned_to']:
                return item
        return None
    
    def run_agent(self, agent_name, task_description, model=None, extra_context=None):
        """Run an agent using opencode run command with --agent and --model flags."""
        import threading
        import queue
        
        print(f"\n🔄 Spawning fresh agent: {agent_name}")
        print(f"📋 Task: {task_description}")
        
        if model:
            print(f"🤖 Model: {model}")
        
        if extra_context:
            print(f"📝 Context: {extra_context}")
        
        # Build opencode run command with --agent and --model flags
        cmd = ['opencode', 'run']
        
        if model:
            cmd.extend(['--model', model])
        
        cmd.extend(['--agent', agent_name, task_description])
        
        print(f"▶️  Executing: {' '.join(cmd)}")
        print(f"⏱️  Timeout: {self.agent_timeout_seconds // 60} minutes ({self.agent_timeout_seconds} seconds)")
        print()
        
        try:
            # Run opencode with real-time output streaming
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            # Queues for output capture
            stdout_queue = queue.Queue()
            stderr_queue = queue.Queue()
            full_output = []
            
            def read_stdout():
                """Read stdout in thread."""
                try:
                    if process.stdout:
                        for line in process.stdout:
                            line = line.rstrip()
                            if line:
                                stdout_queue.put(line)
                                full_output.append(line)
                except:
                    pass
            
            def read_stderr():
                """Read stderr in thread."""
                try:
                    if process.stderr:
                        for line in process.stderr:
                            line = line.rstrip()
                            if line:
                                stderr_queue.put(line)
                                full_output.append(f"[stderr] {line}")
                except:
                    pass
            
            # Start reader threads
            stdout_thread = threading.Thread(target=read_stdout, daemon=True)
            stderr_thread = threading.Thread(target=read_stderr, daemon=True)
            stdout_thread.start()
            stderr_thread.start()
            
            # Monitor process with timeout
            start_time = time.time()
            last_output_time = start_time
            lines_printed = 0
            max_lines_to_print = 1000  # Prevent console spam
            
            print("📊 Agent output (streaming)...")
            print("-" * 60)
            
            while True:
                # Check if timed out
                elapsed = time.time() - start_time
                if elapsed > self.agent_timeout_seconds:
                    print(f"\n⏱️  TIMEOUT after {self.agent_timeout_seconds // 60} minutes")
                    process.kill()
                    break
                
                # Print any new stdout
                try:
                    while True:
                        line = stdout_queue.get_nowait()
                        if lines_printed < max_lines_to_print:
                            print(f"  {line}")
                            lines_printed += 1
                        elif lines_printed == max_lines_to_print:
                            print(f"  ... (output truncated, see log file)")
                            lines_printed += 1
                        last_output_time = time.time()
                except queue.Empty:
                    pass
                
                # Print any new stderr
                try:
                    while True:
                        line = stderr_queue.get_nowait()
                        if lines_printed < max_lines_to_print:
                            print(f"  ⚠️ {line}")
                            lines_printed += 1
                except queue.Empty:
                    pass
                
                # Check if process ended
                if process.poll() is not None:
                    # Wait for threads to finish
                    stdout_thread.join(timeout=2)
                    stderr_thread.join(timeout=2)
                    break
                
                # Short sleep to prevent CPU spin
                time.sleep(0.1)
            
            # Get final return code
            return_code = process.returncode if process.returncode is not None else -1
            
            # Print summary
            print("-" * 60)
            print(f"📄 Total output lines: {len(full_output)}")
            
            # Save full output to log file
            log_file = Path(f".speclang/agent_{agent_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
            with open(log_file, 'w') as f:
                f.write(f"Agent: {agent_name}\n")
                f.write(f"Task: {task_description}\n")
                f.write(f"Started: {datetime.now().isoformat()}\n")
                f.write(f"Timeout: {self.agent_timeout_seconds}s\n")
                f.write(f"Return code: {return_code}\n")
                f.write("=" * 60 + "\n\n")
                f.write('\n'.join(full_output))
            
            print(f"💾 Full log saved to: {log_file}")
            
            if return_code != 0:
                print(f"  ❌ Agent exited with code {return_code}")
                return {
                    'success': False,
                    'return_code': return_code,
                    'output': '\n'.join(full_output),
                    'agent': agent_name,
                    'log_file': str(log_file)
                }
            else:
                print(f"  ✅ Agent completed successfully")
                return {
                    'success': True,
                    'return_code': return_code,
                    'output': '\n'.join(full_output),
                    'agent': agent_name,
                    'log_file': str(log_file)
                }
        
        except FileNotFoundError:
            print(f"  ❌ ERROR: 'opencode' command not found")
            print(f"  💡 Make sure OpenCode CLI is installed and in PATH")
            return {
                'success': False,
                'error': 'opencode_not_found',
                'agent': agent_name
            }
        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'agent': agent_name
            }
    
    def invoke_builder_agent(self, item):
        """Invoke Builder agent to work on item."""
        print(f"\n{'=' * 60}")
        print(f"[BUILDER ITERATION] {self.builder_agent}")
        print(f"{'=' * 60}")
        
        # Build full prompt with PROMPT.md as system context
        if self.builder_prompt:
            full_prompt = f"""{self.builder_prompt}

---

## CURRENT TASK

Section: {item['section']}
Task: {item['description']}

Please complete this task following the Builder Agent workflow above."""
        else:
            full_prompt = f"Section: {item['section']}\nTask: {item['description']}"
        
        print(f"📝 Prompt loaded: {len(full_prompt)} chars")
        
        result = self.run_agent(
            self.builder_agent,
            full_prompt,
            model=self.builder_model
        )
        
        # Track what files were modified
        files_modified = self._get_recently_modified_files()
        
        return {
            'result': result,
            'files_modified': files_modified
        }
    
    def invoke_verifier_agent(self, item, builder_result):
        """Invoke Verifier agent to validate work."""
        print(f"\n{'=' * 60}")
        print(f"[VERIFIER ITERATION] {self.verifier_agent}")
        print(f"{'=' * 60}")
        
        files_to_review = builder_result.get('files_modified', [])
        
        # Build full prompt with PROMPT-VERIFY.md as system context
        if self.verifier_prompt:
            full_prompt = f"""{self.verifier_prompt}

---

## CURRENT VALIDATION TASK

Task: {item['description']}
Files modified: {len(files_to_review)}
Files to review: {', '.join(files_to_review) if files_to_review else 'See git diff'}

Please validate this work following the Verifier Agent workflow above."""
        else:
            full_prompt = f"Task: {item['description']}\nFiles modified: {len(files_to_review)}"
        
        print(f"📝 Prompt loaded: {len(full_prompt)} chars")
        
        result = self.run_agent(
            self.verifier_agent,
            full_prompt,
            model=self.verifier_model
        )
        
        return {
            'result': result,
            'validation_context': full_prompt
        }
    
    def _get_recently_modified_files(self):
        """Get list of recently modified files for verification."""
        try:
            result = subprocess.run(
                ['git', 'diff', '--name-only', 'HEAD~1..HEAD'],
                capture_output=True,
                text=True,
                timeout=5
            )
            files = result.stdout.strip().split('\n') if result.stdout else []
            return [f for f in files if f]
        except Exception as e:
            print(f"  ⚠️  Could not get git changes: {str(e)}")
            return []
    
    def process_steering_packets(self):
        """Process steering packets to determine next action."""
        if not self.steering_packets:
            return None
        
        # Get most recent unprocessed packet
        for packet in reversed(self.steering_packets):
            if not packet['processed']:
                self.current_item = packet
                return packet
        
        return None
    
    def run_loop(self):
        """Run Ralph Loop until convergence or max iterations."""
        print("=" * 60)
        print("🚀 REAL RALPH LOOP ORCHESTRATOR")
        print("=" * 60)
        print(f"📋 Builder: {self.builder_agent}")
        print(f"👁️  Verifier: {self.verifier_agent}")
        print(f"📝 TODO file: {self.todo_file}")
        print(f"🔄 Max iterations: {self.max_iterations}")
        print(f"💾 State file: {self.state_file}")
        print("=" * 60)
        print()
        
        items = self.load_todo()
        state = self.load_state()
        state['total_items'] = len(items)
        state['completed_items'] = sum(1 for item in items if item['completed'])
        
        iteration = 0
        
        while iteration < self.max_iterations:
            # Check for convergence
            pending_items = [i for i in items if not i['completed']]
            if not pending_items:
                print("\n" + "=" * 60)
                print("🎉 ALL ITEMS COMPLETED - LOOP CONVERGED!")
                print("=" * 60)
                break
            
            iteration += 1
            print(f"\n{'─' * 60}")
            print(f"📍 ITERATION {iteration}")
            print(f"📊 Pending items: {len(pending_items)}")
            print(f"{'─' * 60}")
            
            # Check steering packets for feedback
            steering = self.process_steering_packets()
            if steering:
                print(f"\n📨 Processing steering packet: {steering['type']}")
                
                if steering['type'] == 'error_report':
                    # Re-assign failed item for retry
                    task_id = steering['task_id']
                    for item in items:
                        if task_id in item.get('description', ''):
                            item['assigned_to'] = None
                            item['validation_passed'] = False
                            print(f"  🔄 Item {task_id} released for retry")
                    
                    steering['processed'] = True
                    self.save_state(state)
                    time.sleep(1)
                    continue
                
                elif steering['type'] == 'success_confirmation':
                    # Mark item as completed
                    task_id = steering['task_id']
                    for item in items:
                        if task_id in item.get('description', ''):
                            item['completed'] = True
                            item['completed_at'] = datetime.now().isoformat()
                            item['validation_passed'] = True
                            print(f"  ✅ Item {task_id} confirmed complete")
                    
                    steering['processed'] = True
                    state['completed_items'] = sum(1 for item in items if item['completed'])
                    self.save_state(state)
            
            # Get next item
            item = self.get_next_item(items)
            if not item:
                print("\n" + "=" * 60)
                print("🎉 ALL ITEMS COMPLETED!")
                print("=" * 60)
                break
            
            print(f"\n🎯 Current item: {item['description']}")
            print(f"📂 Section: {item['section']}")
            
            # Assign to builder
            item['assigned_to'] = self.builder_agent
            item['started_at'] = datetime.now().isoformat()
            
            # Builder works
            print(f"\n🔨 Phase 1: BUILDER AGENT")
            builder_result = self.invoke_builder_agent(item)
            
            if not builder_result.get('result', {}).get('success', False):
                print(f"\n❌ Builder failed, retrying next iteration...")
                time.sleep(2)
                continue
            
            # Verifier validates
            print(f"\n🔍 Phase 2: VERIFIER AGENT")
            verifier_result = self.invoke_verifier_agent(item, builder_result)
            
            if not verifier_result.get('result', {}).get('success', False):
                print(f"\n❌ Verifier failed, retrying next iteration...")
                time.sleep(2)
                continue
            
            # Brief pause between iterations
            print(f"\n✨ Iteration {iteration} complete, updating state...")
            state['iterations_completed'] = iteration
            self.save_state(state)
            self.save_todo(items)
            
            print(f"{'─' * 60}")
            time.sleep(1)
        
        print(f"\n{'=' * 60}")
        print("🏁 LOOP COMPLETE")
        print(f"{'=' * 60}")
        print(f"📊 Iterations completed: {iteration}")
        print(f"✅ Items completed: {state['completed_items']}/{state['total_items']}")
        print(f"📨 Steering packets: {len(self.steering_packets)}")
        print(f"💾 State saved to: {self.state_file}")
        print(f"📝 Steering packets: .speclang/steering_packets.json")
        print(f"{'=' * 60}")
        
        return state


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='REAL Ralph Loop orchestrator using opencode run commands',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
This is a REAL Ralph Loop that invokes actual agents using opencode run.
Agents run with fresh context each iteration following Ralph Wiggum pattern.

Examples:
  python3 ralph_loop.py
  python3 ralph_loop.py --builder-agent speclang-simulator --verifier-agent build
  python3 ralph_loop.py -b speclang-simulator -v build --builder-model synthetic/hf:deepseek-ai/DeepSeek-V3.2
  python3 ralph_loop.py -b speclang-simulator -v build -t TODO.md -m 50 --agent-timeout 30
        '''
    )
    
    parser.add_argument(
        '-b', '--builder-agent',
        default='speclang-simulator',
        help='Builder agent name (default: speclang-simulator)'
    )
    
    parser.add_argument(
        '--builder-model',
        default='synthetic/hf:deepseek-ai/DeepSeek-V3.2',
        help='Builder agent model (default: synthetic/hf:deepseek-ai/DeepSeek-V3.2)'
    )
    
    parser.add_argument(
        '-v', '--verifier-agent',
        default='build',
        help='Verifier agent name (default: build)'
    )
    
    parser.add_argument(
        '--verifier-model',
        default='synthetic/hf:deepseek-ai/DeepSeek-V3.2',
        help='Verifier agent model (default: synthetic/hf:deepseek-ai/DeepSeek-V3.2)'
    )
    
    parser.add_argument(
        '-t', '--todo-file',
        default='TODO.md',
        help='Path to TODO.md file (default: TODO.md)'
    )
    
    parser.add_argument(
        '-m', '--max-iterations',
        type=int,
        default=10,
        help='Maximum number of loop iterations (default: 10)'
    )
    
    parser.add_argument(
        '--state-file',
        default='.speclang/ralph_state.json',
        help='Path to state file (default: .speclang/ralph_state.json)'
    )
    
    parser.add_argument(
        '--agent-timeout',
        type=float,
        default=30.0,
        help='Agent timeout in minutes (default: 30.0, accepts decimals like 0.5)'
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    print("=" * 60)
    print("🚀 REAL RALPH LOOP ORCHESTRATOR")
    print("=" * 60)
    print(f"Configuration:")
    print(f"  🤖 Builder: {args.builder_agent}")
    print(f"  🧠 Builder Model: {args.builder_model}")
    print(f"  👁️  Verifier: {args.verifier_agent}")
    print(f"  🧠 Verifier Model: {args.verifier_model}")
    print(f"  📝 TODO: {args.todo_file}")
    print(f"  🔄 Max iterations: {args.max_iterations}")
    print(f"  ⏱️  Agent timeout: {args.agent_timeout} min ({args.agent_timeout * 60} sec)")
    print(f"  💾 State: {args.state_file}")
    print("=" * 60)
    print()
    print("⚠️  IMPORTANT: This invokes REAL agents using opencode run")
    print("⚠️  Each iteration spawns a FRESH agent instance")
    print("⚠️  Memory lives in git, TODO.md, steering packets - NOT in conversation")
    print("⚠️  Following Ralph Wiggum pattern for context management")
    print()
    
    # Create loop instance
    loop = RalphLoop(
        builder_agent=args.builder_agent,
        verifier_agent=args.verifier_agent,
        builder_model=args.builder_model,
        verifier_model=args.verifier_model,
        todo_file=args.todo_file,
        max_iterations=args.max_iterations,
        agent_timeout_minutes=args.agent_timeout
    )
    
    # Check if TODO file exists
    if not loop.todo_file.exists():
        print(f"❌ ERROR: TODO.md not found at {args.todo_file}. Please create it first.")
        return
    
    # Run loop
    state = loop.run_loop()
    
    print("\n" + "=" * 60)
    print("📋 NEXT STEPS")
    print("=" * 60)
    print("1. Review steering packets: cat .speclang/steering_packets.json")
    print("2. Check git changes: git diff")
    print("3. Review agent output above")
    print("\n🔄 To run again:")
    print(f"  python3 ralph_loop.py -b {args.builder_agent} -v {args.verifier_agent}")


if __name__ == "__main__":
    main()
