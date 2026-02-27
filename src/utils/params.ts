export function buildParams(query: Record<string, any>): object {

    const results = Object.entries(query).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
            acc[key] = value.join(',')
        } else if (typeof value === 'boolean') {
            acc[key] = value.toString()
        } else {
            acc[key] = String(value)
        }

        return acc;
    }, {} as Record<string, string>);

    return results;
}