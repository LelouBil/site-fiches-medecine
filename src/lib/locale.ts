

export const sortCollate = Intl.Collator(
    "fr",
    {
        usage: "sort",
        sensitivity: "variant",
        ignorePunctuation: true,
        numeric: true,
        caseFirst: "upper"
    }
)

export function sortString<T,U>(selector: (x: T | U) => string | [(x: T) => string, (x: U) => string]) {
    return (a: T | U, b: T | U) => {
        const [sa, sb] = selector instanceof Array ? [selector[0],selector[1]]: [selector,selector]
        return sortCollate.compare(sa(a),sb(b))
    }
}