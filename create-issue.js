exports.handler = async function(event) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Kun POST er tillatt." })
        };
    }

    try {
        const data = JSON.parse(event.body || "{}");

        const owner = "NatanaelFosse";
        const repo = "Oybitenkundeportal";
        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "GITHUB_TOKEN mangler i miljøvariablene." })
            };
        }

        if (!data.tittel || !data.navn || !data.epost || !data.dato) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Mangler nødvendige felter." })
            };
        }

        const title = `[Kundeportal] ${data.tittel}`.slice(0, 240);

        const body = `
Ny sak sendt inn fra Øybiten Kundeportal.

**Lokalt saksnummer:** #${data.lokaltSaksnummer || "Ukjent"}
**Navn:** ${data.navn}
**E-post:** ${data.epost}
**Tittel:** ${data.tittel}
**Beskrivelse:** ${data.beskrivelse || "Ingen beskrivelse"}
**Dato:** ${data.dato}
        `.trim();

        const response = await fetch(`[api.github.com](https://api.github.com/repos/${owner}/${repo}/issues)`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "oybitenkundeportal"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                labels: ["kundeportal"]
            })
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: "Kunne ikke opprette GitHub issue.",
                    details: result
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                issueUrl: result.html_url,
                issueNumber: result.number
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Serverfeil.",
                details: error.message
            })
        };
    }
};
