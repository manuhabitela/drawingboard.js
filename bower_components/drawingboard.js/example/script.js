var content;
$('script[data-example], style[data-example]').each(function(n, item) {
	content = $(this).html();
	$('div[data-example="' + $(this).attr('data-example') + '"]')
		.append(
			'<pre><code class="language-' + ( $(this).prop('tagName').toLowerCase() === 'script' ? 'javascript' : 'css') + '">' +
			$(this).html()
				.replace(/[<>]/g, function(m) { return {'<':'&lt;','>':'&gt;'}[m];})
				.replace(/\t\t\t/g, "")
				.replace(/^\n/g, "")
				.replace(/\t\t$/g, "")
				.replace(/\n$/g, "") +
			'</pre></code>'
		);
});

var _gaq=[['_setAccount','UA-13184829-2'],['_trackPageview']];
(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
s.parentNode.insertBefore(g,s)}(document,'script'));