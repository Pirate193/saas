import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";

export const polar = new Polar(components.polar,{
    products:{
        Folders_Pro:"b87a4c7c-d869-4992-9dee-f30847c6f8ac"
    },
    getUserInfo: async (ctx)=>{
        const user:any = await ctx.runQuery(api.user.getCurrentUser);
        return {
            userId:user.userId,
            email:user.email,
        }
    },
});

export const {
  getConfiguredProducts,
  listAllProducts,//Lists all non-archived products, useful if you don't configure products by key.
  generateCheckoutLink,//Generates a checkout link for the given product IDs.
  generateCustomerPortalUrl,//Generates a customer portal URL for the current user.
  changeCurrentSubscription,//Changes the current subscription to the given product ID.
  cancelCurrentSubscription,//Cancels the current subscription.
}= polar.api();