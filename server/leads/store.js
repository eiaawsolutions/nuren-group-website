// Where submitted enquiries are kept so the team can study them on the admin
// dashboard. The email to the team is the primary record; this is the
// searchable copy. Leads append to one JSON-lines file and each attached brief
// is a file beside it, so a Railway volume mounted at LEADS_DIR keeps both
// across deploys. Without a volume the files still work but vanish on
// redeploy, and the dashboard says so. A write failure never blocks a lead:
// it is still held in memory and still emailed.
import fs from 'node:fs';
import path from 'node:path';

const LEADS_FILE = 'leads.jsonl';
const ATTACHMENTS_DIR = 'attachments';
const MAX_IN_MEMORY = 5000;

export function createLeadStore({ dir, onError = () => {} }) {
  const leadsPath = path.join(dir, LEADS_FILE);
  const attachmentsPath = path.join(dir, ATTACHMENTS_DIR);
  /** Newest first. */
  let leads = [];
  let writable = true;

  try {
    fs.mkdirSync(attachmentsPath, { recursive: true });
    if (fs.existsSync(leadsPath)) {
      for (const line of fs.readFileSync(leadsPath, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try {
          leads.push(JSON.parse(line));
        } catch {
          onError('leads:corrupt-line', line.slice(0, 80));
        }
      }
      leads.reverse();
    }
  } catch (err) {
    writable = false;
    onError('leads:init', err?.message || err);
  }

  const attachmentFile = (id) => path.join(attachmentsPath, `${id}.bin`);

  return {
    /** True when leads are being written to disk. */
    get writable() {
      return writable;
    },

    /** Saves a lead (and its brief, if any) and returns the stored record. */
    add(lead, attachment = null) {
      const record = { ...lead };
      leads.unshift(record);
      if (leads.length > MAX_IN_MEMORY) leads.length = MAX_IN_MEMORY;
      if (!writable) return record;
      try {
        if (attachment) fs.writeFileSync(attachmentFile(record.id), attachment.buffer);
        fs.appendFileSync(leadsPath, `${JSON.stringify(record)}\n`);
      } catch (err) {
        onError('leads:write', err?.message || err);
      }
      return record;
    },

    list() {
      return leads;
    },

    get(id) {
      return leads.find((lead) => lead.id === id) ?? null;
    },

    /** The brief's bytes, or null if the lead has none or the file is gone. */
    readAttachment(id) {
      const lead = this.get(id);
      if (!lead?.attachment) return null;
      try {
        return { ...lead.attachment, buffer: fs.readFileSync(attachmentFile(lead.id)) };
      } catch {
        return null;
      }
    },
  };
}
