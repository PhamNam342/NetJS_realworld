import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
@Injectable()
export class HelloService {
  constructor(private readonly i18n: I18nService) {}
  getHello() {
    return {
      message: this.i18n.t('hello.message'),
    };
  }
}
