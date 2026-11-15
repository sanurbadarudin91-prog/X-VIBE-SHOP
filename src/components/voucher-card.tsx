"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { claimVoucher } from "@/lib/actions/vouchers";
import { formatDate, formatIDR } from "@/lib/utils";
import type { Voucher } from "@/lib/types";

export function VoucherCard({
  voucher,
  claimed,
  isLoggedIn,
}: {
  voucher: Voucher;
  claimed: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const expired = voucher.expiry_date
    ? new Date(voucher.expiry_date) < new Date()
    : false;

  const label =
    voucher.discount_type === "percentage"
      ? `${Number(voucher.discount_value)}%`
      : formatIDR(voucher.discount_value);

  function onClaim() {
    if (!isLoggedIn) {
      toast.error("Silakan login untuk mengklaim voucher.");
      router.push("/login?redirectTo=/vouchers");
      return;
    }
    startTransition(async () => {
      const res = await claimVoucher(voucher.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  }

  return (
    <Card className="relative flex flex-col overflow-hidden">
      <div className="absolute right-3 top-3">
        {claimed ? (
          <Badge tone="success">
            <Check className="mr-1 h-3 w-3" /> Diklaim
          </Badge>
        ) : expired ? (
          <Badge tone="danger">Kedaluwarsa</Badge>
        ) : (
          <Badge tone="info">Aktif</Badge>
        )}
      </div>

      <div className="flex items-center gap-3 border-b border-dashed border-border p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <TicketPercent className="h-6 w-6" />
        </span>
        <div>
          <p className="text-2xl font-extrabold text-primary">{label}</p>
          <p className="font-mono text-sm font-semibold tracking-wider">
            {voucher.code}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-5 text-sm">
        <p className="text-muted-foreground">
          Min. belanja{" "}
          <span className="font-medium text-foreground">
            {formatIDR(voucher.min_purchase)}
          </span>
        </p>
        <p className="text-muted-foreground">
          Berlaku hingga{" "}
          <span className="font-medium text-foreground">
            {voucher.expiry_date ? formatDate(voucher.expiry_date) : "tanpa batas"}
          </span>
        </p>
      </div>

      <div className="p-5 pt-0">
        <Button
          onClick={onClaim}
          disabled={claimed || expired}
          loading={pending}
          variant={claimed ? "secondary" : "default"}
          className="w-full"
        >
          {claimed ? "Sudah Diklaim" : expired ? "Kedaluwarsa" : "Klaim Voucher"}
        </Button>
      </div>
    </Card>
  );
}
