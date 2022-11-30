// self-explanatory
export function retrieveTemplateById(id) {
  let template = $("#" + id).clone();
  template.removeAttr("id");
  template.removeClass("template");
  return template;
}
