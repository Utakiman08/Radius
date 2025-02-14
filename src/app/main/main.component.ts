import { Component,ViewEncapsulation } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    // SidebarComponent,
    RouterOutlet,
    CommonModule,
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  encapsulation: ViewEncapsulation.Emulated // This is the default setting

})
export class MainComponent {
  sourceComponent!: string ;

  // This method will handle the activated component
  onComponentActivate(component: any) {
    if (component && component.componentName) {
      this.sourceComponent = component.componentName;
    }
  }

}