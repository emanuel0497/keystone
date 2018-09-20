describe('List view URL state', () => {
  before(() => cy.visit('/reset-db'));

  it('Stores currentPage state in the url', () => {
    // Loading at page 3
    cy.visit('/admin/posts?currentPage=3');
    cy.get('#ks-pagination button:nth-of-type(3)')
      .should('have.attr', 'aria-current', 'page')
      .should('contain', '3');

    // Navigate to page 2
    cy.get('#ks-pagination button:nth-of-type(2)')
      .should('contain', '2')
      .click();
    cy.location('search').should('eq', '?currentPage=2');

    // Navigate to page 1 - this is the default so it should remove the search string
    cy.get('#ks-pagination button:first')
      .should('contain', '1')
      .click();

    cy.location('search').should('eq', '');
  });
  it('Stores pageSize state in the url', () => {
    cy.visit('/admin/posts');

    cy.get('#ks-pagination nav>div:first').should('contain', 'Showing 1 to 50 of');
    cy.get('#ks-list-table tbody tr').should('have.lengthOf', 50);

    cy.visit('/admin/posts?pageSize=75');
    cy.get('#ks-pagination nav>div:first').should('contain', 'Showing 1 to 75 of');
    cy.get('#ks-list-table tbody tr').should('have.lengthOf', 75);

    // click on a page button - to make sure we do not loose the page size
    cy.get('#ks-pagination button:nth-of-type(2)').click();
    cy.location('search')
      .should('contain', 'currentPage=2')
      .should('contain', 'pageSize=75');
  });
  it('Stores search state in the url', () => {
    cy.visit('/admin/posts');

    cy.get('#ks-list-search-input').type('Why');
    cy.location('search').should('eq', '?search=Why');

    // The results should be updated.
    cy.get('#ks-list-table tbody tr:first').should('contain', 'Why');

    cy.visit('/admin/posts?search=Hello');
    cy.get('#ks-list-search-input').should('have.attr', 'value', 'Hello');
  });
  it('Stores field settings in the url', () => {
    // Without `fields` we should see the default
    cy.visit('/admin/posts');
    cy.get('#ks-list-table thead td')
      .should('have.lengthOf', 3)
      .should('contain', 'Name')
      .should('contain', 'Slug');

    // UI should update the URL
    cy.get('button:contains("Columns")').click();
    cy.get('#app ~ div')
      .find('input[id^="react-select-"]')
      .clear({ force: true })
      .type(`author{enter}`, { force: true });
    cy.get('#ks-list-table thead td')
      .should('have.lengthOf', 4)
      .should('contain', 'Name')
      .should('contain', 'Slug')
      .should('contain', 'Author');
    cy.location('search').should('eq', '?fields=name%2Cslug%2Cauthor');

    // URL should define the columns
    cy.visit('/admin/posts?fields=name,author,categories');
    cy.get('#ks-list-table thead td')
      .should('have.lengthOf', 4)
      .should('contain', 'Name')
      .should('contain', 'Author')
      .should('contain', 'Categories');
  });
  it('Stores sortBy state in the url', () => {
    cy.visit('/admin/posts');
    cy.get('h1 button').should('contain', 'name');

    cy.visit('/admin/posts?sortBy=status');
    cy.get('h1 button').should('contain', 'status');

    // Sort DESC
    cy.visit('/admin/posts?sortBy=-name');
    cy.get('h1 button').should('contain', 'name');

    // UI should update url
    cy.get('h1 button').click();
    cy.get('#app ~ div')
      .find('input[id^="react-select-"]')
      .clear({ force: true })
      .type(`categories{enter}`, { force: true });
    cy.location('search').should('eq', '?sortBy=categories');
  });
  it('Stores filter state in the url', () => {
    // Filter defined in the url
    cy.visit('/admin/posts?!name_contains="Hello"');
    cy.get('#ks-list-active-filters button:nth-of-type(1)').should(
      'contain',
      'Name contains: "Hello"'
    );

    // Clear the filter
    cy.get('#ks-list-active-filters button:nth-of-type(2)').click();
    cy.location('search').should('eq', '');

    // Set a filter
    cy.visit('/admin/posts');
    cy.get('button:contains("Filters")').click();
    cy.get('#app ~ div')
      .find('input[id^="react-select-"]')
      .clear({ force: true })
      .type(`name{enter}`, { force: true });
    cy.get('#app ~ div')
      .find('input[placeholder="Name contains"]')
      .clear()
      .type(`keystone{enter}`);
    cy.location('search').should('eq', '?!name_contains=%22keystone%22');
    cy.get('#ks-list-active-filters button:nth-of-type(1)').should(
      'contain',
      'Name contains: "keystone"'
    );
  });

  // - combination
  it('Combines state in the url', () => {
    // Testing config from search string
    // ---------------------------------
    const params = [
      'currentPage=2',
      'pageSize=10',
      'search=Why',
      'fields=name,views',
      'sortBy=-views',
      '!views_gt="10"',
    ];
    cy.visit(`/admin/posts?${params.join('&')}`);

    // Shows the currentPage
    cy.get('#ks-pagination button:nth-of-type(2)').should('have.attr', 'aria-current', 'page');
    // Has the correct number of items per page (pageSize)
    cy.get('#ks-pagination nav>div:first').should('contain', 'Showing 11 to 20 of');
    // Search
    cy.get('#ks-list-search-input').should('have.attr', 'value', 'Why');
    // Has the correct columns (fields)
    cy.get('#ks-list-table thead td')
      .should('have.lengthOf', 3)
      .should('contain', 'Name')
      .should('contain', 'Views');
    // Is sorted by sortby
    cy.get('h1 button').should('contain', 'views');
    // Has the filter
    cy.get('#ks-list-active-filters button:nth-of-type(1)').should(
      'contain',
      'Views is greater than: "10"'
    );

    // Testing re-creating the search string from config
    // ---------------------------------

    // Go to page 1
    cy.get('#ks-pagination button:nth-of-type(1)').click();

    cy.location('search')
      .should('not.contain', 'currentPage')
      .should('contain', 'pageSize=10')
      .should('contain', 'search=Why')
      .should('contain', 'fields=name%2Cviews')
      .should('contain', 'sortBy=-views')
      .should('contain', '!views_gt=%2210%22');
  });
});