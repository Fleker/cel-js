import { Component } from '@angular/core';
import { CelServiceService } from './cel-service.service';
import { Pokemon } from './pokemon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'demo-src';

  playerPokemon: Pokemon[] = [{
    dex: 1,
    species: 'Bulbasaur',
    type1: 'Grass',
    type2: 'Poison',
  }, {
    dex: 4,
    species: 'Charmander',
    type1: 'Fire',
  }, {
    dex: 12,
    species: 'Butterfree',
    type1: 'Bug',
    type2: 'Flying',
  }, {
    dex: 201,
    species: 'Unown',
    type1: 'Psychic',
    form: '?'
  }]

  filterPlayerPokemon: Pokemon[] = [...this.playerPokemon]

  cel = ''
  searching = false

  constructor(private celService: CelServiceService) {}

  search() {
    this.searching = true
    window.requestAnimationFrame(async () => {
      this.filterPlayerPokemon = await this.celService.run(this.playerPokemon, this.cel)
      this.searching = false
    })
  }
}
