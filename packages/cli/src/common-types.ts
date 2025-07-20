  import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
  
  export const QuickStarterPrivateStateId = "quickStarterPrivateState";
  export type QuickStarterPrivateStateId = typeof QuickStarterPrivateStateId;
  export type QuickStarterContractProviders = MidnightProviders<
    QuickStarterPrivateStateId
  >;
  