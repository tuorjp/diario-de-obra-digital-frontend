import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface CatalogItem {
  id: number;
  nome: string;
}

export interface CatalogSelectedItem {
  id: number;
  nome: string;
  quantidade: number;
}

export interface CatalogSelectDialogData {
  title: string;
  catalog: CatalogItem[];
  selected: CatalogSelectedItem[];
  quantityLabel?: string; // defaults to 'Qtd.'
  quantityStep?: number;  // defaults to 1, use 0.5 for serviços
}

interface RowState {
  item: CatalogItem;
  checked: boolean;
  quantidade: number;
}

@Component({
  selector: 'app-catalog-select-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './catalog-select-dialog.component.html',
  styleUrls: ['./catalog-select-dialog.component.scss']
})
export class CatalogSelectDialogComponent implements OnInit {
  rows: RowState[] = [];
  filteredRows: RowState[] = [];
  filterText = '';

  get quantityLabel(): string { return this.data.quantityLabel ?? 'Qtd.'; }
  get quantityStep(): number  { return this.data.quantityStep  ?? 1; }

  get selectedCount(): number { return this.rows.filter(r => r.checked).length; }

  constructor(
    public dialogRef: MatDialogRef<CatalogSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CatalogSelectDialogData
  ) {}

  ngOnInit(): void {
    // Build row state from catalog, pre-checking already-selected items
    this.rows = this.data.catalog.map(item => {
      const existing = this.data.selected.find(s => s.id === item.id);
      return {
        item,
        checked: !!existing,
        quantidade: existing?.quantidade ?? 1
      };
    });
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.filterText.trim().toLowerCase();
    this.filteredRows = term
      ? this.rows.filter(r => r.item.nome.toLowerCase().includes(term))
      : [...this.rows];
  }

  toggleCheck(row: RowState): void {
    row.checked = !row.checked;
    if (row.checked && row.quantidade < 1) {
      row.quantidade = 1;
    }
  }

  clampQuantity(row: RowState): void {
    const min = this.quantityStep;
    if (!row.quantidade || row.quantidade < min) {
      row.quantidade = min;
    }
  }

  save(): void {
    const result: CatalogSelectedItem[] = this.rows
      .filter(r => r.checked)
      .map(r => ({ id: r.item.id, nome: r.item.nome, quantidade: r.quantidade }));
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
