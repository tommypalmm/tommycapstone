import { appUrl } from "@/lib/format";

// One-snippet embed for any site builder:
//   <script src="https://APP/embed.js" data-business="SLUG" async></script>
// Inserts the shared-domain booking widget as an iframe where the script tag sits.
export function GET() {
  const base = appUrl();
  const js = `(function(){
  var s = document.currentScript || document.querySelector('script[data-business]');
  if (!s) return;
  var slug = s.getAttribute('data-business');
  var qs = new URLSearchParams(location.search);
  var p = new URLSearchParams({ b: slug, embed: '1' });
  ['src','utm_source','ref'].forEach(function(k){ if (qs.get(k)) p.set(k, qs.get(k)); });
  var f = document.createElement('iframe');
  f.src = ${JSON.stringify(base)} + '/book?' + p.toString();
  f.title = 'Book an appointment';
  f.style.cssText = 'width:100%;min-height:760px;border:0;';
  f.loading = 'lazy';
  s.parentNode.insertBefore(f, s);
})();`;
  return new Response(js, {
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
