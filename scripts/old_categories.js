// adds filters that are not yet active, used in toggleCategories
export function showCategories() {
    let _filter = CommonServices.retrieveTemplateById("filter-element-template");
    _filter.addClass("filter-element-addition");
  
    let addIcon = CommonServices.retrieveTemplateById("add-filter-icon-template");
    _filter.find(".icon-container").append(addIcon);
  
    for (let category of globals.Categories) {
      if (!category.IsActive) {
        let filter = _filter.clone();
        filter.find(".filter-name").html(category.Name);
        $("#add-filter-button").after(filter);
      }
    }
  
    let removeIcon = CommonServices.retrieveTemplateById(
      "remove-filter-icon-template"
    );
    let iconContainer = $("#manage-categories-icon-container");
    iconContainer.empty();
    iconContainer.append(removeIcon);
  
    addListeners();
  }
  
  // removes inactive filters, used in toggleCategories
  export function hideCategories() {
    $(".filter-element-addition").remove();
  
    let addIcon = CommonServices.retrieveTemplateById("add-filter-icon-template");
    let iconContainer = $("#manage-categories-icon-container");
    iconContainer.empty();
    iconContainer.append(addIcon);
    addListeners();
  }
  
  // adds active filter to container by it's name, used in applyURL
  export function addFilter(filterName) {
    let filter = CommonServices.retrieveTemplateById("filter-element-template");
    filter.addClass("filter-element-active");
  
    let removeIcon = CommonServices.retrieveTemplateById(
      "remove-filter-icon-template"
    );
    filter.find(".icon-container").append(removeIcon);
  
    filter.find(".filter-name").html(filterName);
  
    $("#add-filter-button").after(filter);
  
    globals.Categories.find(
      (x) => x.Name === filter.find(".filter-name").text()
    ).IsActive = true;
  
    manageFilterButtons();
    addListeners();
  }
  
  // transfers filter to active state
  // listens to add buttons on filters
  export function activateFilter() {
    let filter = $(this).parents(".filter-element-addition");
    filter.removeClass("filter-element-addition");
    filter.addClass("filter-element-active");
  
    globals.Categories.find(
      (x) => x.Name === filter.find(".filter-name").text()
    ).IsActive = true;
  
    let removeIcon = CommonServices.retrieveTemplateById(
      "remove-filter-icon-template"
    );
    filter.find(".icon-container").html(removeIcon);
  
    manageFilterButtons();
    addListeners();
  }
  
  // removes filter or sets it to inactive state, depending on whether add button is active
  // listens to remove buttons on filters
  export function deactivateFilter() {
    let filter = $(this).parents(".filter-element-active");
  
    if (globals.State.categoryAdditionActive) {
      filter.removeClass("filter-element-active");
      filter.addClass("filter-element-addition");
  
      let addIcon = CommonServices.retrieveTemplateById(
        "add-filter-icon-template"
      );
      filter.find(".icon-container").html(addIcon);
    } else {
      $(this).parents(".filter-element-active").remove();
    }
  
    globals.Categories.find(
      (x) => x.Name === filter.find(".filter-name").text()
    ).IsActive = false;
  
    manageFilterButtons();
    addListeners();
  }
  
  // adjusts add and garbage buttons so they correspond to current active filters
  export function manageFilterButtons() {
    let allEnabled = true;
    let anyEnabled = false;
  
    for (let category of globals.Categories) {
      if (!category.IsActive) {
        allEnabled = false;
      } else {
        anyEnabled = true;
      }
    }
  
    // show add button only if there are filters to add
    if (allEnabled) {
      $("#add-filter-button").remove();
      hideCategories();
    } else if ($("#add-filter-button").length === 0) {
      let _filter = CommonServices.retrieveTemplateById(
        "filter-element-template"
      );
      _filter.attr("id", "add-filter-button");
      _filter.find(".filter-name").remove();
  
      let addIcon = CommonServices.retrieveTemplateById(
        "add-filter-icon-template"
      );
      _filter.find(".icon-container").append(addIcon);
      _filter.find(".icon-container").attr("id", "manage-categories-icon-container");
      $(".filter-anchor").prepend(_filter);
    }
  
    // show remove all button only if there are any active filters
    if (!anyEnabled) {
      $("#delete-filter-button").remove();
    } else if ($("#delete-filter-button").length === 0) {
      let _filter = CommonServices.retrieveTemplateById(
        "filter-element-template"
      );
      _filter.addClass("in-the-end");
      _filter.attr("id", "delete-filter-button");
      _filter.find(".filter-name").remove();
  
      let addIcon = CommonServices.retrieveTemplateById("garbage-icon-template");
      _filter.find(".icon-container").append(addIcon);
      $(".filter-anchor").append(_filter);
    }
  }
  
  // deactivates all filters, listens to garbage icon clicks
  export function removeAllCategories() {
    $(".filter-element-active").each(function () {
      if (globals.State.categoryAdditionActive) {
        $(this).removeClass("filter-element-active");
        $(this).addClass("filter-element-addition");
  
        let addIcon = CommonServices.retrieveTemplateById(
          "add-filter-icon-template"
        );
        $(this).find(".icon-container").html(addIcon);
      } else {
        $(this).remove();
      }
    });
  
    for (let category of globals.Categories) {
      category.IsActive = false;
    }
  
    manageFilterButtons();
    addListeners();
    // UrlServices.updateURL(globals, Constants);
  }