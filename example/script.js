var content;
$('script[data-example]').each(function(n, item) {
	content = $(this).html();
	$('div[data-example="' + $(this).attr('data-example') + '"]')
		.append(
			'<pre><code class="language-javascript">' +
			$(this).html()
				.replace(/[<>]/g, function(m) { return {'<':'&lt;','>':'&gt;'}[m];})
				.replace(/\t\t\t/g, "")
				.replace(/^\n/g, "")
				.replace(/\t\t$/g, "")
				.replace(/\n$/g, "") +
			'</pre></code>'
		);
});
