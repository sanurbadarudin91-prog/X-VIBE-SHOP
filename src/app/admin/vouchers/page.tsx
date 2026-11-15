import { VoucherManager } from "@/components/admin/voucher-manager";
import { getAdminVouchers } from "@/lib/queries";

export const metadata = { title: "Manajemen Voucher" };

export default async function AdminVouchersPage() {
  const vouchers = await getAdminVouchers();
  return <VoucherManager vouchers={vouchers} />;
}
