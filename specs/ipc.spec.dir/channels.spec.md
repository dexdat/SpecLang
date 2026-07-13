# speclang-header lines:11
id: "@speclang/ipc/channels"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [ipc, channels, communication]
short: "IPC communication channels"
parent: "speclang/ipc"
part: 2/2
---
## @block:channels @kind:entity
IPC channels establish and manage communication pathways between processes.

### @block::channel-types @kind:enum
```typescript
enum ChannelType {
  MAIN = 'main',
  RENDERER = 'renderer',
  WORKER = 'worker',
  SHARED = 'shared'
}
```

### @block::channel-interface @kind:interface
```typescript
interface Channel {
  id: string;
  type: ChannelType;
  connected: boolean;
  send(message: Message): void;
  onMessage(callback: (message: Message) => void): void;
}
```

### @block::channel-management @kind:function
Channels are managed by the IPC system, ensuring proper lifecycle and cleanup.