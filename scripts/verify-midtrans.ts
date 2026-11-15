import crypto from "node:crypto";
import {
  resolveNotificationOutcome,
  verifySignature,
  type MidtransNotification,
} from "../src/lib/payments/midtrans";

process.env.MIDTRANS_SERVER_KEY = "Mid-server-test";

function sign(orderId: string, statusCode: string, gross: string) {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${gross}Mid-server-test`)
    .digest("hex");
}

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`OK   ${name}`); }
  else { fail++; console.log(`FAIL ${name}`); }
}

const orderId = "XV-11111111-2222-3333-4444-555555555555";
const gross = "150000.00";
const statusCode = "200";

const good: MidtransNotification = {
  order_id: orderId,
  status_code: statusCode,
  gross_amount: gross,
  signature_key: sign(orderId, statusCode, gross),
  transaction_status: "settlement",
};
check("signature valid diterima", verifySignature(good));
check("signature salah ditolak", !verifySignature({ ...good, signature_key: sign(orderId, statusCode, "999") }));
check("signature kosong ditolak", !verifySignature({ ...good, signature_key: "" }));
check("signature beda panjang ditolak", !verifySignature({ ...good, signature_key: "abc" }));

check("settlement -> paid", resolveNotificationOutcome({ transaction_status: "settlement" }) === "paid");
check("capture accept -> paid", resolveNotificationOutcome({ transaction_status: "capture", fraud_status: "accept" }) === "paid");
check("capture challenge -> ignored", resolveNotificationOutcome({ transaction_status: "capture", fraud_status: "challenge" }) === "ignored");
check("pending -> ignored", resolveNotificationOutcome({ transaction_status: "pending" }) === "ignored");
check("expire -> cancelled", resolveNotificationOutcome({ transaction_status: "expire" }) === "cancelled");
check("deny -> cancelled", resolveNotificationOutcome({ transaction_status: "deny" }) === "cancelled");
check("cancel -> cancelled", resolveNotificationOutcome({ transaction_status: "cancel" }) === "cancelled");
check("refund -> ignored", resolveNotificationOutcome({ transaction_status: "refund" }) === "ignored");

console.log(`\n${pass} lolos, ${fail} gagal`);
process.exit(fail === 0 ? 0 : 1);
