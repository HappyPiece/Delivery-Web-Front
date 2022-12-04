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
  baseURL: "http://127.0.0.1:5500",
  backendURL: "https://food-delivery.kreosoft.ru",
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
      vegOnlyButtonPressed: false,
      currentPage: 1,
      currentPagination: undefined,
    };
  }
}

let globals = new Globals();

$(document).ready(function () {
  managePage();

  // console.log(
  //   Constants.backendURL +
  //     "/api/dish" +
  //     UrlServices.formArtifactsQuery(globals, Constants)
  // );

  fetch(
    Constants.backendURL +
      "/api/dish" +
      UrlServices.formArtifactsQuery(globals, Constants)
  )
    .then((responce) => responce.json())
    .then((result) => console.log(result));
});

export async function managePage() {
  await populatePage();
  addListeners();
}

export async function populatePage() {
  UrlServices.applyURL(globals, Constants);
  await loadContent();
  manageSortings();
}

export async function loadContent() {
  let responce = await fetch(
    Constants.backendURL +
      "/api/dish" +
      UrlServices.formArtifactsQuery(globals, Constants)
  );
  let result = await responce.json();
  loadMenu(result);
}

export function reloadContent() {
  let cardholder = $(".my-cardholder");
  cardholder.empty();
  loadContent();
}

export function loadMenu(result) {
  createCards(result.dishes);
  globals.State.currentPagination = result.pagination;
  managePagination();
}

export function managePagination() {
  let paginationContainer = $(".pagination-container");
  paginationContainer.empty();
  // console.log(globals.State.currentPagination);
  if (globals.State.currentPagination.count > 1) {
    let newPagination = CommonServices.retrieveTemplateById(
      "pagination-template"
    );
    newPagination.find(".to-first-page").attr("to-page", 1);
    newPagination
      .find(".to-last-page")
      .attr("to-page", globals.State.currentPagination.count);
    let _toPageElement = CommonServices.retrieveTemplateById(
      "pagination-element-page-number-template"
    );
    for (
      let i = Math.min(
        Number(globals.State.currentPagination.count),
        Number(Number(globals.State.currentPage) + 1)
      );
      i >= Math.max(Number(Number(globals.State.currentPage) - 1), 1);
      i--
    ) {
      console.log(i);
      let toPageElement = _toPageElement.clone();
      toPageElement.html(i);
      toPageElement.attr("to-page", i);
      if (i == globals.State.currentPage) {
        toPageElement.attr("active", 1);
      } else {
        toPageElement.attr("active", 0);
      }
      // console.log(i);
      newPagination.find(".to-first-page").after(toPageElement);
    }
    paginationContainer.append(newPagination);
  }
  addListeners();
}

export function createCards(dishes) {
  let _card = CommonServices.retrieveTemplateById("menu-card-template");
  let cardholder = $(".my-cardholder");
  // console.log(dishes);
  if (dishes !== null && dishes !== undefined) {
    if (dishes.length > 0) {
      for (let dish of dishes) {
        let card = _card.clone();
        card.find(".my-card-picture").attr("src", dish.image);
        if (dish.vegetarian) {
          card
            .find(".veg-icon-container")
            .append(CommonServices.retrieveTemplateById("veg-icon-template"));
        }
        card.find(".my-card-name").html(dish.name);
        card
          .find(".my-card-category")
          .html(
            globals.Categories.find((x) => x.Codename === dish.category).Name
          );
        let rating = card.find(".my-card-rating");
        let dishRating = dish.rating;
        for (let i = 0; i < 10; i++) {
          if (dishRating >= 1) {
            rating.append(
              CommonServices.retrieveTemplateById("star-icon-template")
            );
            dishRating -= 1;
            continue;
          } else if (dishRating >= 0.5) {
            rating.append(
              CommonServices.retrieveTemplateById("star-half-icon-template")
            );
            dishRating = 0;
            continue;
          } else {
            rating.append(
              CommonServices.retrieveTemplateById("star-outlined-icon-template")
            );
          }
        }
        card.find(".my-card-description").html(dish.description);
        card.find(".my-card-price").html(dish.price + "₽");
        cardholder.append(card);
      }
    } else {
      let plug = CommonServices.retrieveTemplateById("error-plug-template");
      plug
        .find(".error-emoji-acnhor")
        .append(CommonServices.retrieveTemplateById("crying"));
      plug.find(".error-message").html("We don't have such dishes");
      cardholder.append(plug);
    }
  } else {
    let plug = CommonServices.retrieveTemplateById("error-plug-template");
    plug
      .find(".error-emoji-acnhor")
      .append(CommonServices.retrieveTemplateById("shruggie"));
    plug.find(".error-message").html("Something went wrong");
    cardholder.append(plug);
  }
}

// assigns ot re- assigns corresponding listeners to all the elements in the page
export function addListeners() {
  $("*").off();

  //
  $("#filter-manage-icon-container").find("span").on("click", manageFilters);

  $("#delete-filter-button").find("span").on("click", removeAllFilters);

  $("#veg-only-toggle").on("click", manageVegOnly);

  $("#apply-filters-bitton").on("click", applyFilters);

  //
  $(".filter-element-addition")
    .find(".add-filter-icon")
    .on("click", activateFilter);

  // console.log($(".pagination-element-base").length);
  $(".pagination-element-base").on("click", navigateToMenuPage);

  //
  $(".filter-element-active")
    .find(".remove-filter-icon")
    .on("click", deactivateFilter);

  $(".hidden-option").on("click", activateOption);

  $("body").on("click", breakDialogs);
}

export function navigateToMenuPage() {
  globals.State.currentPage = $(this).attr("to-page");
  UrlServices.updateURL(globals, Constants);
  reloadContent();
}

// bruh
export function breakDialogs() {
  //removeFilters();
}

export function applyFilters() {
  UrlServices.updateURL(globals, Constants);
  reloadContent();
}

export function manageVegOnly() {
  if (!globals.State.vegOnlyButtonPressed) {
    addVegOnly();
  } else {
    removeVegOnly();
  }
}

export function addVegOnly() {
  globals.State.vegOnlyButtonPressed = true;
  $("#veg-only-toggle").attr("active", 1);
  // UrlServices.updateURL(globals, Constants);
}

export function removeVegOnly() {
  globals.State.vegOnlyButtonPressed = false;
  $("#veg-only-toggle").attr("active", 0);
  // UrlServices.updateURL(globals, Constants);
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
  let iconContainer = $("#filter-manage-icon-container");
  iconContainer.empty();
  iconContainer.append(removeIcon);
  globals.State.addFilterButtonPressed = true;
  addListeners();
}

// removes inactive filters, used in manageFilters
export function removeFilters() {
  $(".filter-element-addition").remove();

  let addIcon = CommonServices.retrieveTemplateById("add-filter-icon-template");
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
  // UrlServices.updateURL(globals, Constants);
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
  // UrlServices.updateURL(globals, Constants);
}

// removes filter or sets it to inactive state, depending on whether add button is active
// listens to remove buttons on filters
export function deactivateFilter() {
  let filter = $(this).parents(".filter-element-active");

  if (globals.State.addFilterButtonPressed) {
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
  // UrlServices.updateURL(globals, Constants);
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

    let addIcon = CommonServices.retrieveTemplateById(
      "add-filter-icon-template"
    );
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
  // UrlServices.updateURL(globals, Constants);
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
