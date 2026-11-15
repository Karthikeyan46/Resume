/* ---------------------------------------------------------------------------
   Supabase connection settings.

   WHERE TO FIND THESE
   -------------------
   Easiest route: the **Connect** button at the top of your project dashboard.
   It shows the Project URL and the key together, ready to copy.

   Or through settings:
     Project URL -> Settings -> Data API   ("Project URL")
     Key         -> Settings -> API Keys   ("Publishable key", starts sb_publishable_)
                    If that section looks empty, click "Create new API keys".
                    The older "anon public" key sits under the "Legacy API keys"
                    tab and works exactly the same, but Supabase is retiring
                    legacy keys — prefer the publishable one.

   Either key works here. Both are meant to be public and are safe to commit:
   they grant nothing on their own. Row Level Security (db/schema.sql) decides
   what they can reach, which is only the public_records view.

   Never put a "secret" or "service_role" key in this file — those bypass every
   security policy you have.
--------------------------------------------------------------------------- */
// Project URL = https://<project-ref>.supabase.co, and your project ref is the
// long code in your dashboard address bar: /dashboard/project/<project-ref>/...
window.SUPABASE_URL = 'https://uwucpestdhsctucjwdld.supabase.co';

// Settings -> API Keys -> "anon public" (Legacy tab) or "Publishable key".
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dWNwZXN0ZGhzY3R1Y2p3ZGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTIzMDUsImV4cCI6MjEwMTQ4ODMwNX0.7dEr9vDK3yuG6NEU_A0LMyLNtswHVp5ia0i7ahmkT-Y';

window.SUPABASE_READY = function () {
    var url = window.SUPABASE_URL;
    var key = window.SUPABASE_ANON_KEY;

    if (typeof url !== 'string' || !/^https:\/\/[^.]+\.supabase\.(co|in)/.test(url)) return false;
    if (typeof key !== 'string' || key.length < 30) return false;
    if (key.indexOf('PASTE_') === 0) return false;

    // guard against pasting a server-side key into a file that ships publicly
    if (key.indexOf('sb_secret_') === 0) {
        console.error('SUPABASE_ANON_KEY is a SECRET key. Use the publishable ' +
            '(or legacy anon) key instead — secret keys bypass Row Level Security.');
        return false;
    }
    return true;
};
