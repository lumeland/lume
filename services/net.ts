export interface NetworkInterfaceInfo {
  family: "IPv4" | "IPv6";
  address: string;
}

export function networkInterfaces(): NetworkInterfaceInfo[] {
  return Deno.networkInterfaces();
}
