export const RenderCategoryToken = 'RenderCategoryBase';

export class RenderCategoryServiceBase {
  public CreateRenderer = <ListItem, Extra = undefined>(
    ...params: ConstructorParameters<typeof CategoryRenderer<ListItem, Extra>>
  ) => new CategoryRenderer(...params);

  public CreateText(text: string) {
    const element = document.createElement('div');
    element.textContent = text;
    return element;
  }
}

export class CategoryRenderer<ListItem, Extra> {
  public constructor(
    private readonly renderItem: (
      item: ListItem,
      extra?: Extra,
    ) => HTMLLIElement,
    private readonly element: HTMLElement | null,
  ) {}

  public RefreshList(items: ListItem[], extra?: Extra) {
    this.element?.replaceChildren(
      ...items.map((item) => this.renderItem(item, extra)),
    );
  }
}
