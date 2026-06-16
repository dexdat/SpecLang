# speclang-header lines:10
id: "@speclang/ipc/messages"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [ipc, messages, typescript]
short: "IPC message types and formats"
parent: "@speclang/ipc"
part: 1/2
---
## @block:messages @kind:entity
IPC messages are the fundamental data units exchanged between processes.

### @block::message-types @kind:enum
```typescript
enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  ERROR = 'error'
}
```

### @block::message-format @kind:interface
```typescript
interface Message {
  id: string;
  type: MessageType;
  payload: any;
  timestamp: number;
  correlationId?: string;
}
```

### @block::serialization @kind:function
Messages are serialized using JSON for cross‑process compatibility.