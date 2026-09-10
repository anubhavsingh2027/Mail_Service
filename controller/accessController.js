import { emailJobs, websiteAccess } from "../utils/mongodb.js";
import {
  createWebsiteAccessData,
  validateAccessStatus,
} from "../model/mailData.js";
import { getAuthCredentials } from "../utils/authUtils.js";

export function accessPage(req, res) {
  const { email, password } = getAuthCredentials(req);
  res
    .type("html")
    .send(
      `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Website Access</title><style>body{font-family:Arial;margin:0;padding:32px;background:#f4f6f9;color:#1a1a1a}main{max-width:900px;margin:auto;background:#fff;padding:28px;border-radius:10px}input{width:100%;box-sizing:border-box;padding:11px;margin:12px 0 20px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:13px 10px;border-bottom:1px solid #e5e7eb}button{border:0;border-radius:5px;padding:8px 13px;cursor:pointer;color:#fff;background:#2563eb}</style></head><body><main><h1>Website Email Access</h1><input id="search" type="search" placeholder="Search website name"><table><thead><tr><th>Website</th><th>Emails sent</th><th>Access</th><th>Action</th></tr></thead><tbody id="websites"><tr><td colspan="4">No websites found yet.</td></tr></tbody></table></main><script>const authHeaders=${JSON.stringify({ "x-auth-email": email, "x-auth-password": password })},search=document.querySelector('#search'),table=document.querySelector('#websites');async function load(){try{const r=await fetch('/api/website-access?search='+encodeURIComponent(search.value),{headers:authHeaders}),j=await r.json();if(!r.ok)throw Error(j.error);const a=Array.isArray(j.data)?j.data:[];table.innerHTML=a.length?a.map(w=>'<tr><td>'+w.websiteName+'</td><td>'+w.noOfEmailSend+'</td><td>'+w.sentAccess+'</td><td><button data-access="'+w.sentAccess+'" data-website="'+encodeURIComponent(w.websiteName)+'">'+(w.sentAccess==='access'?'Disable':'Enable')+'</button></td></tr>').join(''):'<tr><td colspan="4">No websites found yet.</td></tr>'}catch(e){table.innerHTML='<tr><td colspan="4">'+e.message+'</td></tr>'}}table.onclick=async e=>{const b=e.target.closest('button');if(!b)return;await fetch('/api/website-access/'+b.dataset.website,{method:'PUT',headers:{'Content-Type':'application/json',...authHeaders},body:JSON.stringify({sentAccess:b.dataset.access==='access'?'not access':'access'})});load()};search.oninput=load;load()</script></body></html>`,
    );
}

export async function listWebsiteAccess(req, res, next) {
  try {
    const search = String(req.query.search || "").trim();
    const accessRecords = await websiteAccess()
      .aggregate([
        ...(search
          ? [{ $match: { websiteName: { $regex: search, $options: "i" } } }]
          : []),
        {
          $project: {
            _id: 0,
            websiteName: 1,
            sentAccess: 1,
            noOfEmailSend: { $ifNull: ["$noOfEmailSend", 0] },
          },
        },
        { $sort: { websiteName: 1 } },
      ])
      .toArray();
    const jobRecords = await emailJobs()
      .aggregate([
        { $match: { websiteName: { $exists: true, $type: "string" } } },
        ...(search
          ? [{ $match: { websiteName: { $regex: search, $options: "i" } } }]
          : []),
        {
          $group: {
            _id: "$websiteName",
            sentCount: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();
    const byName = new Map(
      accessRecords.map((website) => [website.websiteName, website]),
    );
    for (const record of jobRecords) {
      const website = byName.get(record._id) || {
        websiteName: record._id,
        sentAccess: "access",
        noOfEmailSend: 0,
      };
      website.noOfEmailSend = Math.max(
        website.noOfEmailSend || 0,
        record.sentCount,
      );
      byName.set(record._id, website);
    }
    const data = [...byName.values()].sort((a, b) =>
      a.websiteName.localeCompare(b.websiteName),
    );
    return res.json({ success: true, data, websites: data });
  } catch (error) {
    return next(error);
  }
}

export async function updateWebsiteAccess(req, res, next) {
  try {
    validateAccessStatus(req.body.sentAccess);
    const websiteName = decodeURIComponent(req.params.websiteName).trim();
    if (!websiteName)
      return res
        .status(400)
        .json({ success: false, error: "websiteName is required" });
    const website = await websiteAccess().findOneAndUpdate(
      { websiteName },
      {
        $set: { sentAccess: req.body.sentAccess },
        $setOnInsert: createWebsiteAccessData(websiteName),
      },
      { upsert: true, returnDocument: "after", projection: { _id: 0 } },
    );
    return res.json({ success: true, website });
  } catch (error) {
    if (error.message === "sentAccess must be access or not access")
      return res.status(400).json({ success: false, error: error.message });
    return next(error);
  }
}
