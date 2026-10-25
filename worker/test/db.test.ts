import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localD1 } from './helpers/local-d1.ts';

test('production schema enforces funnel enums and read status without importing history', async () => {
  const local = await localD1();
  try {
    assert.equal(await local.db.prepare('SELECT COUNT(*) FROM contact_requests').first('COUNT(*)'), 0);
    assert.equal(await local.db.prepare('SELECT COUNT(*) FROM contact_funnel_events').first('COUNT(*)'), 0);
    for (const event of ['cta_click', 'form_start', 'form_submit_success']) {
      for (const source of ['hero', 'nav', 'contact_form']) {
        await local.db.prepare('INSERT INTO contact_funnel_events(session_id,event,source) VALUES(?,?,?)').bind('session-123', event, source).run();
      }
    }
    await assert.rejects(local.db.prepare('INSERT INTO contact_funnel_events(session_id,event) VALUES(?,?)').bind('session-123', 'delete').run());
    await assert.rejects(local.db.prepare('INSERT INTO contact_funnel_events(session_id,event,source) VALUES(?,?,?)').bind('session-123', 'cta_click', 'admin').run());
    await assert.rejects(local.db.prepare('INSERT INTO contact_requests(name,email,subject,message,is_read) VALUES(?,?,?,?,?)').bind('Ada', 'a@b.com', 'Project', 'Project idea!', 2).run());
  } finally { await local.dispose(); }
});
