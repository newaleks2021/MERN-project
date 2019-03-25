import React, { Component } from "react";
import { Switch, Route, withRouter } from "react-router-dom";
import classNames from "classnames";
import axios from "axios";
import { withStore } from "../store";
import Admin from "./Admin";
import Welcome from "./Welcome";
import EmailResponse from "./EmailResponse";
import TocAcademy from "./TocAcademy";
import TocAcademyTopic from "./TocAcademyTopic";
import TocAcademyPost from "./TocAcademyPost";
import TocsPublic from "./TocsPublic";
import TocPublic from "./TocPublic";
import Experts from "./Experts";
import Expert from "./Expert";
import Support from "./Support";
import Partnerships from "./Partnerships";
import Contact from "./Contact";
import Pricing from "./Pricing";
import SupportForm from "./SupportForm";
import Privacy from "./Privacy";
import Terms from "./Terms";
import Landing from "./Landing";
import Plans from "./Plans";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import PasswordForgot from "./PasswordForgot";
import PasswordNew from "./PasswordNew";
import MoveToc from "./MoveToc";
import TocAdmin from "./TocAdmin";
import Organisations from "./Organisations";
import Organisation from "./Organisation";
import Modal from "./Modal";
import Notification from "./Notification";
import Done from "./Done";
import Navigation from "./Navigation";
// import { copyFile } from 'fs';

class Base extends Component {
  componentWillMount() {
    const { IP, api, history, pages, dispatch, show_navigation } = this.props;
    const update = () => {
      let page = history.location.pathname.split("/")[1] || "welcome";
      console.log("page: ", page);
      // @FIXME this should be defined in routing and display 404
      if (pages.indexOf(page) === -1) page = "welcome";
      window.document.documentElement.dataset.page = page;
      dispatch({ minimize_navigation: !show_navigation });
    };
    
    history.listen(update);
    update();
    this.componentWillReceiveProps(this.props);
    axios({
      url: `${IP}/signin`,
      withCredentials: true,
      method: "get"
    })
      .then(res => {
        dispatch({ connected: true });
        // console.log('res cb', res, history.location.pathname.split('/')[1]);
        if (
          !res.data.user &&
          history.location.pathname.split("/")[1] !== "new-password"
        )
          return history.push("/");
        api(res.data);
        if (history.location.pathname === "/") history.push("/landing");
      })
      .catch(err => {
        dispatch({ connected: true });
        if (history.location.pathname.split("/")[1] !== "reset-password")
          return history.push("/");
      });
  }

  componentWillReceiveProps(props) {
    if(this.props.user) {
      window.document.body.classList[props.show_navigation ? "add" : "remove"](
      "nav-status"
    );
    window.document.body.classList[
      props.minimize_navigation ? "add" : "remove"
    ]("toggled");  
    }
    
  }

  render() {
    console.log({ props: this.props });
    const {
      IP,
      api,
      dispatch,
      connected,
      stakeholders,
      minimize_navigation,
      modal,
      user,
      history,
      hard_refresh
    } = this.props;
    if (!connected) return null;
    return [
      hard_refresh ? null : <Notification key="notification" />,
      <Modal key="modal" />,
      user ? (
        <Navigation
          key="navigation"
          user={user}
          dispatch={dispatch}
          IP={IP}
          minimize_navigation={minimize_navigation}
          history={history}
          api={api}
        />
      ) : null,
      <div
        key="black-layer"
        className={classNames({
          "black-layer": true,
          hidden: modal ? false : true
        })}
      />,
      <div key="page" className="page-content">
        <Switch>
          <Route
            path="/move-to-organisation/:token/:toc/:invitor/"
            render={() => <EmailResponse endpoint="move_toc" />}
          />
          <Route
            path="/activate-stakeholder/:token/:id/"
            render={() => (
              <EmailResponse update="false" endpoint="activate_stakeholder" />
            )}
          />
          <Route
            path="/reset-password/:token/:id/"
            render={() => (
              <EmailResponse endpoint="reset_stakeholder_password" />
            )}
          />
          <Route
            path="/update-stakeholder/:token/:id/"
            render={() => (
              <EmailResponse update="true" endpoint="activate_stakeholder" />
            )}
          />
          <Route
            path="/accept-organisation-role/:token/:member"
            render={() => <EmailResponse endpoint="make_stakeholder_admin" />}
          />
          <Route
            path="/accept-toc-role/:token/:member/:role"
            render={() => (
              <EmailResponse endpoint="add_stakeholder_for_toc_role" />
            )}
          />
          <Route
            path="/decline-organisation-role/:token/:member/:invitor"
            render={() => (
              <EmailResponse endpoint="decline_stakeholder_admin" />
            )}
          />
          <Route
            path="/decline-toc-role/:token/:member/:role/:invitor"
            render={() => (
              <EmailResponse endpoint="decline_stakeholder_for_toc_role" />
            )}
          />
          <Route path="/landing" component={Landing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/toc/:id/:tab" component={TocAdmin} />
          <Route path="/toc/:id" component={TocAdmin} />
          <Route path="/organisations" component={Organisations} />
          <Route path="/organisation/:id/:tab" component={Organisation} />
          <Route path="/organisation/:id" component={Organisation} />
          <Route path="/toc-academy" component={TocAcademy} />
          <Route path="/topics/:topic" component={TocAcademyTopic} />
          <Route path="/posts/:post" component={TocAcademyPost} />
          <Route path="/public-tocs" component={TocsPublic} />
          <Route path="/public-toc/:id" component={TocPublic} />
          <Route path="/experts" component={Experts} />
          <Route path="/expert/:id" component={stakeholders ? Expert : null} />
          <Route path="/support" component={Support} />
          <Route path="/partnerships" component={Partnerships} />
          <Route path="/contact" component={Contact} />
          <Route path="/plans" component={Plans} />
          <Route path="/support-form" component={SupportForm} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/sign-up" component={SignUp} />
          <Route path="/sign-in" component={SignIn} />
          <Route path="/admin/:collection" component={Admin} />
          <Route path="/password-forgot" component={PasswordForgot} />
          <Route path="/new-password" component={PasswordNew} />
          <Route path="/move-toc" component={MoveToc} />
          <Route path="/" component={Welcome} />
          <Route path="/success" component={EmailResponse} />
          <Route path="/done" component={Done} />
          {/*
            @TODO This component should be implemented
            <Route component={PageNotFound}/> */}
        </Switch>
      </div>
    ];
  }
}

export default withRouter(withStore(Base));
