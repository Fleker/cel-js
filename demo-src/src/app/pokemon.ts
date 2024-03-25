export type Type = 'Bug' | 'Grass' | 'Poison' | 'Ghost' | 'Psychic'
  | 'Steel' | 'Dark' | 'Fairy' | 'Dragon' | 'Flying'
  | 'Normal' | 'Fire' | 'Water' | 'Ice' | 'Electric'
  | 'Rock' | 'Ground' | 'Fighting'

export interface Pokemon {
  dex: number
  species: string
  type1: Type
  type2?: Type
  form?: string
}