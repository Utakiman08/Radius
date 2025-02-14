// src/app/components/login/login.component.ts

import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SharedService } from './shared.service';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  passwordVisible: boolean = false;

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private toastr:ToastService,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
     this.loginForm = this.fb.group({
      login_id: ['', Validators.required],
      password: ['', Validators.required],  
      device_token: ['token'],
      device_os: ['os'],
      project: ['PVVNL']
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.length > 0) { // Check if there is anything in session storage
        sessionStorage.clear(); // Clear session storage if it has any data
      }
    }
    else{
      return;
    }
  }
  

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }
  
    const formData = this.loginForm.value;
    //console.log('Form Data:', formData); // Debug: Check form values before sending
  
    this.authService.login(formData).subscribe({
      next: (response) => {
        if (response.rc === 0) {
          this.sharedService.setFormData(formData); // Store the form data in the service
          this.router.navigate(['main'])
          this.toastr.success('Login Success'); // Alert for incorrect password or other error

        } else {
          this.toastr.error('Login failed: ' + response.message); // Alert for incorrect password or other error
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.toastr.warning('An error occurred during login. Please try again.'); // Alert for any server or network error
        console.error('Login Error:', error);
      }
    });
  }

  // Assuming you're using Angular, add this in the corresponding component class
togglePassword() {
  const passwordField = document.getElementById('signin-password') as HTMLInputElement;
  const toggleIcon = document.getElementById('toggleIcon') as HTMLElement;

  // Toggle the type attribute
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggleIcon.classList.remove('ri-eye-off-line');
    toggleIcon.classList.add('ri-eye-line');
  } else {
    passwordField.type = 'password';
    toggleIcon.classList.remove('ri-eye-line');
    toggleIcon.classList.add('ri-eye-off-line');
  }
}

  
  
  
}
