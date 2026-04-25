export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {
    const rules = makeRoutingRuleHandlers(registry)

    app.get('/services/:serviceId/routing-rules',      rules.list)
    app.post('/services/:serviceId/routing-rules',     rules.create)
    app.put('/routing-rules/:ruleId',                  rules.update)
    app.delete('/routing-rules/:ruleId',               rules.delete)
}