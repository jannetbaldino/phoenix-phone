function isInFiveM() {
  return (window as any).GetParentResourceName !== undefined;
}

export async function nuiCall<T = any>(name: string, payload?: any): Promise<T> {
  // Client expects: name is ox_lib callback id like 'prp-phone:getProfile'
  // We call into client NUI callback 'phone:call'
  const res = await fetch(`https://${(window as any).GetParentResourceName?.() ?? "nui"}/phone:call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, payload })
  });

  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? "unknown_error");
  return json.data as T;
}

export async function nuiClose() {
  if (!isInFiveM()) return;
  await fetch(`https://${(window as any).GetParentResourceName()}/phone:close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
}
