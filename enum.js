export function enum_(...names) {
  let result = {}
  for (const name_id in names) {
    result[name_id] = names[name_id]
    result[names[name_id]] = name_id
  }
  return result
}
