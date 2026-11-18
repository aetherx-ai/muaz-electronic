import { CustomerOrder } from '../types';

export interface ParsedOrderAddress {
  streetAddress: string;
  thana?: string;
  district?: string;
  division?: string;
}

const STRUCTURED_SUFFIX_REGEX =
  /\s*\|\s*থানা:\s*([^,]+),\s*জেলা:\s*([^,]+),\s*বিভাগ:\s*(.+)$/;

export function formatOrderDeliveryAddress(
  streetAddress: string,
  division?: string,
  district?: string,
  thana?: string
): string {
  const cleanStreet = streetAddress.trim();
  if (division && district && thana) {
    return `${cleanStreet} | থানা: ${thana.trim()}, জেলা: ${district.trim()}, বিভাগ: ${division.trim()}`;
  }
  return cleanStreet;
}

export function extractOrderAddressBreakdown(order: Pick<CustomerOrder, 'deliveryAddress' | 'division' | 'district' | 'thana'>): ParsedOrderAddress {
  const raw = (order.deliveryAddress || '').trim();
  const match = raw.match(STRUCTURED_SUFFIX_REGEX);

  if (match) {
    const streetOnly = raw.slice(0, match.index).trim();
    return {
      streetAddress: streetOnly || raw,
      thana: order.thana || match[1].trim(),
      district: order.district || match[2].trim(),
      division: order.division || match[3].trim(),
    };
  }

  return {
    streetAddress: raw,
    thana: order.thana,
    district: order.district,
    division: order.division,
  };
}
