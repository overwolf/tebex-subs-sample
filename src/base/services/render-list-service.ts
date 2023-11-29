export const RenderListToken = 'RenderListBase';

export class RenderListServiceBase {
  public CreateRenderer = <ListItem, Extra = undefined>(
    ...params: ConstructorParameters<typeof ListRenderer<ListItem, Extra>>
  ) => new ListRenderer(...params);

  public CreateText(text: string) {
    const element = document.createElement('div');
    element.textContent = text;
    return element;
  }
}

export class ListRenderer<ListItem, Extra> {
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
