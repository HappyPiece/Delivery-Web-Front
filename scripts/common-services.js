// self-explanatory
export function retrieveTemplateById(globals, Constants, id) {
  let template = globals.Templates.find("#" + id).clone();
  template.removeAttr("id");
  template.removeClass("template");
  // console.log(id);
  // console.log(template.length);
  return template;
}
