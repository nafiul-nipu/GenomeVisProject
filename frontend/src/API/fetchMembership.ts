import type {
  FetchMembershipArgs,
  MembershipState,
} from "../types/data_types_interfaces";

export async function fetchMembership({
  speciesName,
  chrName,
}: FetchMembershipArgs): Promise<MembershipState> {
  const basePath = import.meta.env.VITE_PUBLIC_DATA_PATH;
  const url = `${basePath}${speciesName}/shape_data/${chrName}/membership.json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch membership.json: ${res.statusText}`);
  }
  const json = (await res.json()) as MembershipState;
  return json;
}
