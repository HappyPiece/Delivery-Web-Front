import * as CommonServices from "/scripts/common-services.js";
import * as UrlServices from "/scripts/url-services.js";

export default class Category {
  constructor(_name, _codename, _isActive = false) {
    this.Name = _name;
    this.Codename = _codename;
    this.IsActive = _isActive;
  }
}

let Constants = {
  baseURL: "http://127.0.0.1:5500/",
  queryContent: /(?<==)\w*/g,
};

class Globals {
  constructor() {
    this.Categories = new Array(
      new Category("Wok", "Wok"),
      new Category("Пицца", "Pizza"),
      new Category("Суп", "Soup"),
      new Category("Десерт", "Dessert"),
      new Category("Напиток", "Drink")
    );

    this.Sortings = new Array(
      new Category("По имени А-Я", "NameAsc"),
      new Category("По имени Я-А", "NameDesc"),
      new Category("По возрастанию цены", "PriceAsc"),
      new Category("По убыванию цены", "PriceDesc"),
      new Category("По возрастанию рейтинга", "RatingAsc"),
      new Category("По убыванию рейтинга", "RatingDesc"),
      new Category("Без сортировки", "NoSort", true)
    );

    this.State = {
      addFilterButtonPressed: false,
    };
  }
}

let globals = new Globals();

$(document).ready(function () {
  populatePage();
  addListeners();
});

function populatePage() {
  UrlServices.applyURL(globals, Constants);
  manageSortings();
  // console.log(globals.Sortings);
}

// assigns ot re- assigns corresponding listeners to all the elements in the page
export function addListeners() {
  $("*").off();

  //
  $("#filter-manage-icon-container").find("span").on("click", manageFilters);

  $("#delete-filter-button").find("span").on("click", removeAllFilters);

  //
  $(".filter-element-addition")
    .find(".add-filter-icon")
    .on("click", activateFilter);

  //
  $(".filter-element-active")
    .find(".remove-filter-icon")
    .on("click", deactivateFilter);

  $(".hidden-option").on("click", activateOption);

  $("body").on("click", breakDialogs);
}

// bruh
export function breakDialogs() {
  //removeFilters();
}

// adds or removes inactive filters, corresponding to current state of add button, to which it listens
export function manageFilters() {
  if (!globals.State.addFilterButtonPressed) {
    addFilters();
  } else {
    removeFilters();
  }
}

// adds filters that are not yet active, used in manageFilters
export function addFilters() {
  let _filter = CommonServices.retrieveTemplateById("filter-element-template");
  _filter.addClass("filter-element-addition");

  let addIcon = CommonServices.retrieveTemplateById("add-icon-template");
  _filter.find(".icon-container").append(addIcon);

  for (let category of globals.Categories) {
    if (!category.IsActive) {
      let filter = _filter.clone();
      filter.find(".filter-name").html(category.Name);
      $("#add-filter-button").after(filter);
    }
  }

  let removeIcon = CommonServices.retrieveTemplateById("remove-icon-template");
  let iconContainer = $("#filter-manage-icon-container");
  iconContainer.empty();
  iconContainer.append(removeIcon);
  globals.State.addFilterButtonPressed = true;
  addListeners();
}

// removes inactive filters, used in manageFilters
export function removeFilters() {
  $(".filter-element-addition").remove();

  let addIcon = CommonServices.retrieveTemplateById("add-icon-template");
  let iconContainer = $("#filter-manage-icon-container");
  iconContainer.empty();
  iconContainer.append(addIcon);
  globals.State.addFilterButtonPressed = false;
  addListeners();
}

// adds active filter to container by it's name, used in applyURL
export function addFilter(filterName) {
  let filter = CommonServices.retrieveTemplateById("filter-element-template");
  filter.addClass("filter-element-active");

  let removeIcon = CommonServices.retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").append(removeIcon);

  filter.find(".filter-name").html(filterName);

  $("#add-filter-button").after(filter);

  globals.Categories.find(
    (x) => x.Name === filter.find(".filter-name").text()
  ).IsActive = true;

  manageFilterButtons();
  addListeners();
  UrlServices.updateURL(globals, Constants);
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

  let removeIcon = CommonServices.retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").html(removeIcon);

  manageFilterButtons();
  addListeners();
  UrlServices.updateURL(globals, Constants);
}

// removes filter or sets it to inactive state, depending on whether add button is active
// listens to remove buttons on filters
export function deactivateFilter() {
  let filter = $(this).parents(".filter-element-active");

  if (globals.State.addFilterButtonPressed) {
    filter.removeClass("filter-element-active");
    filter.addClass("filter-element-addition");

    let addIcon = CommonServices.retrieveTemplateById("add-icon-template");
    filter.find(".icon-container").html(addIcon);
  } else {
    $(this).parents(".filter-element-active").remove();
  }

  globals.Categories.find(
    (x) => x.Name === filter.find(".filter-name").text()
  ).IsActive = false;

  manageFilterButtons();
  addListeners();
  UrlServices.updateURL(globals, Constants);
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
    removeFilters();
  } else if ($("#add-filter-button").length === 0) {
    let _filter = CommonServices.retrieveTemplateById(
      "filter-element-template"
    );
    _filter.attr("id", "add-filter-button");
    _filter.find(".filter-name").remove();

    let addIcon = CommonServices.retrieveTemplateById("add-icon-template");
    _filter.find(".icon-container").append(addIcon);
    _filter.find(".icon-container").attr("id", "filter-manage-icon-container");
    $(".filter-container").prepend(_filter);
  }

  // show remove all button only if there is any filter active
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
    $(".filter-container").append(_filter);
  }
}

// deactivates all filters, listens to garbage icon clicks
export function removeAllFilters() {
  $(".filter-element-active").each(function () {
    if (globals.State.addFilterButtonPressed) {
      $(this).removeClass("filter-element-active");
      $(this).addClass("filter-element-addition");

      let addIcon = CommonServices.retrieveTemplateById("add-icon-template");
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
  UrlServices.updateURL(globals, Constants);
}

export function activateOption() {
  setSorting($(this).find(".option-name").attr("id"));
  manageSortings();
}

export function setSorting(sorting_codename) {
  for (let sorting of globals.Sortings) {
    if (sorting_codename === sorting.Codename) {
      sorting.IsActive = true;
    } else {
      sorting.IsActive = false;
    }
  }
  UrlServices.updateURL(globals, Constants);
}

export function manageSortings() {
  $(".dropdown-content").find(".option").remove();
  let _option = CommonServices.retrieveTemplateById(
    "dropdown-element-template"
  );
  for (let sorting of globals.Sortings) {
    let option = _option.clone();
    if (sorting.IsActive) {
      option.addClass("active-option");
      option.attr("id", "active-sorting-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option
        .find(`#${sorting.Codename}`)
        .html(sorting.Codename === "NoSort" ? "Сортировать по" : sorting.Name);
      option
        .find(".icon-container")
        .html(CommonServices.retrieveTemplateById("expand-more-icon-template"));
      $(".dropdown-content").prepend(option);
    } else {
      option.addClass("hidden-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option
        .find(`#${sorting.Codename}`)
        .html(sorting.Codename === "NoSort" ? "Без сортировки" : sorting.Name);
      $(".dropdown-options").append(option);
    }
  }
  addListeners();
}
