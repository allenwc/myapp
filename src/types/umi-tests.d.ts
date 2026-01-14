declare module '@@/requestRecordMock' {
  export function startMock(options: any): Promise<{ close: () => void }>;
}

declare module '@@/testBrowser' {
  import React from 'react';
  export const TestBrowser: React.FC<any>;
}
