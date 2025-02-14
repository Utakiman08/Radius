import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as Modernizr from 'modernizr'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  loadScript() {
    throw new Error('Method not implemented.');
  }
ngOnInit(): void {
 
}
 
  title = 'Radius';
}
