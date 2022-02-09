import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from 'src/app/shared/service/article.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { EMPTY, Observable, Observer } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css'],
})
export class ItemComponent implements OnInit {
  validateForm: FormGroup;
  userId = '';
  initLoading = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private fb: FormBuilder,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params.id;
      this.validateForm = this.fb.group({
        title: ['', [Validators.required], [this.userNameAsyncValidator]],
        writer: ['', [Validators.email, Validators.required]],
        // password: ['', [Validators.required]],
        // confirm: ['', [this.confirmValidator]],
        content: ['', [Validators.required]],
        articlePicture: ['', [Validators.required]],
      });
      if (this.userId) {
        this.articleService.getArticle(this.userId).subscribe((res) => {
          console.log(res);
          this.validateForm.controls.title.setValue(res.title);
          this.validateForm.controls.writer.setValue(res.writer);
          this.validateForm.get('content').setValue(res.content);
          this.validateForm.get('articlePicture').setValue(res.articlePicture);
        });
      }
    });
  }

  submitForm(value: {
    title: string;
    writer: string;
    // password: string;
    // confirm: string;
    content: string;
    articlePicture: string;
  }): void {
    for (const key in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(key)) {
        this.validateForm.controls[key].markAsDirty();
        this.validateForm.controls[key].updateValueAndValidity();
      }
    }
    this.initLoading = true;
    if (this.userId) {
      this.updateArticle({ id: this.userId, ...value });
    } else {
      this.createArticle(value);
    }
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.validateForm.reset();
    for (const key in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(key)) {
        this.validateForm.controls[key].markAsPristine();
        this.validateForm.controls[key].updateValueAndValidity();
      }
    }
  }

  validateConfirmPassword(): void {
    setTimeout(() =>
      this.validateForm.controls.confirm.updateValueAndValidity()
    );
  }

  userNameAsyncValidator = (control: FormControl) =>
    new Observable((observer: Observer<ValidationErrors | null>) => {
      setTimeout(() => {
        if (control.value === 'JasonWood') {
          // you have to return `{error: true}` to mark it as an error event
          observer.next({ error: true, duplicated: true });
        } else {
          observer.next(null);
        }
        observer.complete();
      }, 1000);
    });

  confirmValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (control.value !== this.validateForm.controls.password.value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  handleBusinessError() {
    return (error) => {
      console.log('handle business error' + error);
      return EMPTY;
    };
  }

  createArticle(value) {
    this.articleService
      .create(value)
      .pipe(
        catchError(this.handleBusinessError()),
        finalize(() => {
          // 不管怎么走，error或者complete都会隐藏loading
          this.initLoading = false;
        })
      )
      .subscribe((data: any) => {
        this.message.create('success', '创建成功');
        this.router.navigate(['monitor/list']);
      });
  }

  updateArticle(value) {
    this.articleService
      .update(value)
      .pipe(
        catchError(this.handleBusinessError()),
        finalize(() => {
          // 不管怎么走，error或者complete都会隐藏loading
          this.initLoading = false;
        })
      )
      .subscribe((data: any) => {
        this.message.create('success', '更新成功');
        this.router.navigate(['monitor/list']);
      });
  }
}
