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
      categoryAdditionActive: false,
      vegOnlyActive: false,
      currentPage: 1,
      currentPagination: undefined,
      specifiedPage: "",
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

  // fetch(
  //   Constants.backendURL +
  //     "/api/dish" +
  //     UrlServices.formArtifactsQuery(globals, Constants)
  // )
  //   .then((responce) => responce.json())
  //   .then((result) => console.log(result));
});

export async function managePage() {
  UrlServices.applyURL(globals, Constants);
  await renderShell();
  await loadContent();
  assignListeners();
}

export async function renderShell() {
  $("#main-content").empty();
  switch (globals.State.specifiedPage) {
    case "": {
      await renderMenu();
    }
  }
}

export async function renderMenu() {
  let menuContent = CommonServices.retrieveTemplateById(
    "menu-content-template"
  );
  renderCategories(menuContent);

  $("#main-content").append(menuContent);
  manageSortings();
}

export function renderCategories(menuContent) {
  let categoriesAnchor = menuContent.find(".categories-anchor");
  let _category = CommonServices.retrieveTemplateById(
    "category-element-template"
  );

  for (let category of globals.Categories) {
    let newCategory = _category.clone();
    newCategory.attr("category", category.Codename);
    if (category.IsActive === true) {
      newCategory.attr("active", 1);
    }
    newCategory.find(".category-name").html(category.Name);

    categoriesAnchor.append(newCategory);
  }
}

export async function loadContent() {
  switch (globals.State.specifiedPage) {
    case "": {
      loadMenu();
    }
  }
}

export async function loadMenu() {
  let cardholder = $(".my-cardholder");
  let pagination = $(".pagination-container");
  pagination.empty();
  cardholder.empty();
  let responce = await fetch(
    Constants.backendURL +
      "/api/dish" +
      UrlServices.formArtifactsQuery(globals, Constants)
  );
  if (responce.ok == false) {
    showErrorPlug("shruggie", "something went wrong", $(".my-cardholder"));
    console.log("bruh");
    return;
  }

  let result = await responce.json();
  createCards(result.dishes);

  globals.State.currentPagination = result.pagination;
  globals.State.currentPage = result.pagination.current;
  managePagination();
}

export function managePagination() {
  let paginationContainer = $(".pagination-container");
  paginationContainer.empty();
  if (
    globals.State.currentPagination === null ||
    globals.State.currentPagination === undefined
  ) {
    return;
  }
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
      // console.log(i);
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
  assignListeners();
}

export function createCards(dishes) {
  let _card = CommonServices.retrieveTemplateById("menu-card-template");
  let cardholder = $(".my-cardholder");
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
    showErrorPlug("crying", "we don't have such dishes", $(".my-cardholder"));
  }
}

export function showErrorPlug(emoji, message, target) {
  let plug = CommonServices.retrieveTemplateById("error-plug-template");
  plug
    .find(".error-emoji-acnhor")
    .append(CommonServices.retrieveTemplateById(emoji));
  plug.find(".error-message").html(message);
  target.append(plug);
}

// assigns ot re- assigns corresponding listeners to all the elements in the page
export function assignListeners() {
  $("*").off();

  //
  $("#veg-only-toggle").on("click", manageVegOnly);

  $("#apply-filters-bitton").on("click", applyFilters);

  $(".category-element-base").on("click", toggleCategory);

  // console.log($(".pagination-element-base").length);
  $(".pagination-element-base").on("click", navigateToMenuPage);

  //
  $(".hidden-option").on("click", activateOption);
}

export function toggleCategory() {
  if (Number($(this).attr("active")) === 0) {
    setCategory($(this).attr("category"), true);
    $(this).attr("active", 1);
  } else {
    setCategory($(this).attr("category"), false);
    $(this).attr("active", 0);
  }
}

export function setCategory(codename, state) {
  globals.Categories.find(
    (x) =>
      x.Codename === codename
  ).IsActive = state;
}

export function navigateToMenuPage() {
  globals.State.currentPage = $(this).attr("to-page");
  UrlServices.updateURL(globals, Constants);
  loadContent();
  $(this).attr("to-page");
}

export function applyFilters() {
  UrlServices.updateURL(globals, Constants);
  globals.State.currentPage = 1;
  loadMenu();
}

export function manageVegOnly() {
  if (!globals.State.vegOnlyActive) {
    addVegOnly();
  } else {
    removeVegOnly();
  }
}

export function addVegOnly() {
  globals.State.vegOnlyActive = true;
  $("#veg-only-toggle").attr("active", 1);
  // UrlServices.updateURL(globals, Constants);
}

export function removeVegOnly() {
  globals.State.vegOnlyActive = false;
  $("#veg-only-toggle").attr("active", 0);
  // UrlServices.updateURL(globals, Constants);
}

// adds or removes inactive filters, corresponding to current state of add button, to which it listens
export function toggleCategories() {
  if (!globals.State.categoryAdditionActive) {
    globals.State.categoryAdditionActive = true;
  } else {
    globals.State.categoryAdditionActive = false;
  }
  manageCategories();
}

export function manageCategories() {
  if (globals.State.categoryAdditionActive) {
    showCategories();
  } else {
    hideCategories();
  }
}

// activating sorting
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
  assignListeners();
}
