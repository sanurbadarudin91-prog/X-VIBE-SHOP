import { TicketPercent } from "lucide-react";
import { VoucherCard } from "@/components/voucher-card";
import { getActiveVouchers, getCurrentUser, getMyVouchers } from "@/lib/queries";

export const metadata = { title: "Voucher" };

export default async function VouchersPage() {
  const [vouchers, user, myVouchers] = await Promise.all([
    getActiveVouchers(),
    getCurrentUser(),
    getMyVouchers(),
  ]);

  const claimedIds = new Set(myVouchers.map((v) => v.voucher_id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
          <TicketPercent className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voucher Diskon</h1>
          <p className="text-sm text-muted-foreground">
            Klaim voucher dan pakai otomatis saat checkout.
          </p>
        </div>
      </header>

      {vouchers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          Belum ada voucher aktif saat ini.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((v) => (
            <VoucherCard
              key={v.id}
              voucher={v}
              claimed={claimedIds.has(v.id)}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
