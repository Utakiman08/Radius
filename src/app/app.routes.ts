import { Routes } from '@angular/router';
import { DataloggerComponent } from './datalogger/datalogger.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { SensorComponent } from './sensor/sensor.component';
import { SiteComponent } from './site/site.component';
import { DicComponent } from './dic/dic.component';
import { MeterStatusComponent } from './meter-status/meter-status.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'main', component: MainComponent,canActivate:[authGuard],
        children:[
        {path:'',redirectTo:'pvvnl',pathMatch:'full'},
        { path: 'control', loadComponent: () => import('../app/control/control.component').then((c) => c.ControlComponent ) },
        { path: 'pvvnl', loadComponent: () => import('../app/project3/project3.component').then((m) => m.Project3Component) },
        {path:'npcl', loadComponent:()=> import('../app/project2/project2.component').then((m)=> m.Project2Component)},
        {path:'torrent',loadComponent:()=> import('../app/project4/project4.component').then((m)=> m.Project4Component)},
        {path:'amr',loadComponent:()=> import('../app/project-amr/project-amr.component').then((m)=> m.ProjectAMRComponent)},

    ] },
    {path:'Consumer',loadComponent:()=> import('../app/singlepage/singlepage.component').then((m)=>m.SinglepageComponent ),canActivate:[authGuard]},
    { path: 'site', component: SiteComponent,canActivate:[authGuard] },  // Protected route
    { path: 'datalogger', component: DataloggerComponent,canActivate:[authGuard] },  // Protected route
    { path: 'dic', component: DicComponent,canActivate:[authGuard] },  // Protected route
    { path: 'sensor', component: SensorComponent,canActivate:[authGuard] },  // Protected route
    { path: 'Meter_Tabular', component: MeterStatusComponent,canActivate:[authGuard] },  // Protected route
    { path: '**', redirectTo: 'login' }

];
