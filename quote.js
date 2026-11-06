// Receives the quote form and emails it to you via Resend (https://resend.com).
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const json = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
const LABELS = { enquiry: "Enquiry type", company: "Company", contact: "Contact", email: "Email", phone: "Phone / WhatsApp", country: "Country", type: "Magnet type", grade: "Grade", shape: "Shape", dimensions: "Dimensions", coating: "Coating", magnetization: "Magnetization", temperature: "Max temp", quantity: "Quantity", timeline: "Required by", incoterm: "Delivery terms", contactVia: "Preferred contact", notes: "Notes" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  let d; try { d = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid data" }); }
  if (d.website) return json(200, { ok: true }); // honeypot: bots fill this
  const c = {}; for (const k of Object.keys(LABELS)) c[k] = String(d[k] ?? "").trim().slice(0, k === "notes" ? 3000 : 200);
  if (!c.company || !c.contact || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return json(400, { error: "Please fill company, name and a valid email" });

  const key = process.env.RESEND_API_KEY, to = process.env.QUOTE_TO;
  if (!key || !to) return json(500, { error: "Server email is not configured" });

  const rows = Object.entries(LABELS).filter(([k]) => c[k]).map(([k, l]) => `<tr><td style="padding:6px 12px;color:#555"><b>${l}</b></td><td style="padding:6px 12px">${esc(c[k]).replace(/\n/g, "<br>")}</td></tr>`).join("");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Dual Pole Website <onboarding@resend.dev>",
      to: to.split(",").map(s => s.trim()),
      reply_to: c.email,
      subject: `[Dual Pole] ${c.enquiry || "Enquiry"} — ${c.company}`,
      html: `<table style="font:14px Arial;border-collapse:collapse">${rows}</table>`
    })
  });
  if (!r.ok) { console.error("Resend", r.status, await r.text()); return json(502, { error: "Could not deliver the message" }); }
  return json(200, { ok: true });
};
