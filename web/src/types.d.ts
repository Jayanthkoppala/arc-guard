// Ambient global: an inline import keeps this file a script, not a module.
interface Window {
  ethereum?: import("viem").EIP1193Provider;
}
