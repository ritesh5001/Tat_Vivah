export function adminAlertTemplate(data) {
    return {
        subject: `[Admin Alert] ${data.title}`,
        html: `
            <h1>Admin Alert</h1>
            <p><strong>${data.title}</strong></p>
            <p>${data.message}</p>
        `
    };
}
//# sourceMappingURL=admin-alert.js.map