import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControlComponent } from '../app/control/control.component';


const routes: Routes = [
    { path: '', component: ControlComponent }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    declarations: [

    ]
})
export class ControlModule { }
