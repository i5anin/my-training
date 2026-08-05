// Текстовые хелперы каталога: генерация id и форма слова после числительного

// Приводит название к id: пробелы → дефисы, остаются только буквы/цифры/дефис
export function slug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
}

// Форма слова после числительного: 1, 21, 31… → one, иначе → many
// («в 1 тренировке», «в 2 тренировках», «в 11 тренировках»)
export function plural(n: number, one: string, many: string) {
  return n % 10 === 1 && n % 100 !== 11 ? one : many
}
