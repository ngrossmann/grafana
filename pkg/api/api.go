package api

import (
	"github.com/Unknwon/macaron"
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/middleware"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/macaron-contrib/binding"
)

// Register adds http routes
func Register(r *macaron.Macaron) {
	reqSignedIn := middleware.Auth(&middleware.AuthOptions{ReqSignedIn: true})
	reqGrafanaAdmin := middleware.Auth(&middleware.AuthOptions{ReqSignedIn: true, ReqGrafanaAdmin: true})
	reqEditorRole := middleware.RoleAuth(m.ROLE_EDITOR, m.ROLE_ADMIN)
	reqAccountAdmin := middleware.RoleAuth(m.ROLE_ADMIN)
	bind := binding.Bind

	// not logged in views
	r.Get("/", reqSignedIn, Index)
	r.Get("/logout", Logout)
	r.Post("/login", bind(dtos.LoginCommand{}), LoginPost)
	r.Get("/login/:name", OAuthLogin)
	r.Get("/login", LoginView)

	// authed views
	r.Get("/profile/", reqSignedIn, Index)
	r.Get("/account/", reqSignedIn, Index)
	r.Get("/account/datasources/", reqSignedIn, Index)
	r.Get("/account/users/", reqSignedIn, Index)
	r.Get("/account/apikeys/", reqSignedIn, Index)
	r.Get("/account/import/", reqSignedIn, Index)
	r.Get("/admin/settings", reqGrafanaAdmin, Index)
	r.Get("/admin/users", reqGrafanaAdmin, Index)
	r.Get("/admin/users/create", reqGrafanaAdmin, Index)
	r.Get("/admin/users/edit/:id", reqGrafanaAdmin, Index)
	r.Get("/dashboard/*", reqSignedIn, Index)

	// sign up
	r.Get("/signup", Index)
	r.Post("/api/user/signup", bind(m.CreateUserCommand{}), SignUp)

	// authed api
	r.Group("/api", func() {
		// user
		r.Group("/user", func() {
			r.Get("/", GetUser)
			r.Put("/", bind(m.UpdateUserCommand{}), UpdateUser)
			r.Post("/using/:id", SetUsingAccount)
			r.Get("/accounts", GetUserAccounts)
			r.Post("/stars/dashboard/:id", StarDashboard)
			r.Delete("/stars/dashboard/:id", UnstarDashboard)
			r.Put("/password", bind(m.ChangeUserPasswordCommand{}), ChangeUserPassword)
		})

		// account
		r.Group("/org", func() {
			r.Get("/", GetOrg)
			r.Post("/", bind(m.CreateAccountCommand{}), CreateOrg)
			r.Put("/", bind(m.UpdateAccountCommand{}), UpdateOrg)
			r.Post("/users", bind(m.AddAccountUserCommand{}), AddOrgUser)
			r.Get("/users", GetOrgUsers)
			r.Delete("/users/:id", RemoveOrgUser)
		}, reqAccountAdmin)

		// auth api keys
		r.Group("/auth/keys", func() {
			r.Combo("/").
				Get(GetApiKeys).
				Post(bind(m.AddApiKeyCommand{}), AddApiKey).
				Put(bind(m.UpdateApiKeyCommand{}), UpdateApiKey)
			r.Delete("/:id", DeleteApiKey)
		}, reqAccountAdmin)

		// Data sources
		r.Group("/datasources", func() {
			r.Combo("/").Get(GetDataSources).Put(AddDataSource).Post(UpdateDataSource)
			r.Delete("/:id", DeleteDataSource)
			r.Get("/:id", GetDataSourceById)
		}, reqAccountAdmin)

		r.Get("/frontend/settings/", GetFrontendSettings)
		r.Any("/datasources/proxy/:id/*", reqSignedIn, ProxyDataSourceRequest)

		// Dashboard
		r.Group("/dashboards", func() {
			r.Combo("/db/:slug").Get(GetDashboard).Delete(DeleteDashboard)
			r.Post("/db", reqEditorRole, bind(m.SaveDashboardCommand{}), PostDashboard)
			r.Get("/home", GetHomeDashboard)
		})

		// Search
		r.Get("/search/", Search)

		// metrics
		r.Get("/metrics/test", GetTestMetrics)
	}, reqSignedIn)

	// admin api
	r.Group("/api/admin", func() {
		r.Get("/settings", AdminGetSettings)
		r.Get("/users", AdminSearchUsers)
		r.Get("/users/:id", AdminGetUser)
		r.Post("/users", bind(dtos.AdminCreateUserForm{}), AdminCreateUser)
		r.Put("/users/:id/details", bind(dtos.AdminUpdateUserForm{}), AdminUpdateUser)
		r.Put("/users/:id/password", bind(dtos.AdminUpdateUserPasswordForm{}), AdminUpdateUserPassword)
		r.Delete("/users/:id", AdminDeleteUser)
	}, reqGrafanaAdmin)

	// rendering
	r.Get("/render/*", reqSignedIn, RenderToPng)

	r.NotFound(NotFound)
}