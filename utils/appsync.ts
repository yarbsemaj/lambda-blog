export function formatTemplate(template: string): string {
    return template.replace(/[\r\n]/gm, '');
}