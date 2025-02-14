import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Project3Component } from '../project3.component';

const routes: Routes = [
  { path: '', component: Project3Component }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PvvnlRoutingModule { }
