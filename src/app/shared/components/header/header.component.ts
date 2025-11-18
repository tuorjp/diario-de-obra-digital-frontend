import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';

interface Crumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {

  @Output() menuToggle = new EventEmitter<void>();
  breadcrumbs: Crumb[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private title: Title,
    private cdr: ChangeDetectorRef
  ) {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
      });
  }

  private buildBreadcrumbs() {
    const crumbs: Crumb[] = [];

    let route = this.activatedRoute.root;
    let url = '';

    while (route.firstChild) {
      route = route.firstChild;

      const routePath = route.snapshot.url.map(seg => seg.path).join('/');
      const routeData = route.snapshot.data;

      if (routePath.length > 0) {
        url += `/${routePath}`;
      }

      if (routeData && routeData['title']) {
        crumbs.push({
          label: routeData['title'],
          url
        });
      }
    }

    // garante sempre o início
    if (!crumbs.length || crumbs[0].label !== 'Início') {
      crumbs.unshift({ label: 'Início', url: '/dashboard' });
    }

    this.breadcrumbs = crumbs;

    const last = crumbs[crumbs.length - 1];
    if (last) {
      this.title.setTitle(`${last.label} • Hefesto - Diário de Obra Digital`);
    }

    this.cdr.markForCheck(); // Força a atualização em OnPush
  }
}
